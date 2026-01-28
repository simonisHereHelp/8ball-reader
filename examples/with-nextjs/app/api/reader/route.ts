import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PROMPTS_MODE_READER_SOURCE } from "@/lib/jsonCanonSources";
import { GPT_Router } from "@/lib/gptRouter";

type ReaderRequest = {
  mode: string;
};

export async function POST(request: Request) {
  const traceId = crypto.randomUUID();
  const respond = (body: Record<string, string>, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: { "x-trace-id": traceId },
    });

  const session = await auth();
  if (!session) {
    console.warn("[reader]", traceId, "missing session");
    return respond({ response: "Authentication required." }, 401);
  }

  const { mode } = (await request.json()) as ReaderRequest;
  const apiKey = process.env.OPENAI_API_KEY;
  const promptsSource = PROMPTS_MODE_READER_SOURCE;

  console.info("[reader]", traceId, "mode", mode, "source", promptsSource);

  if (!apiKey) {
    console.warn("[reader]", traceId, "missing OPENAI_API_KEY");
    return respond({
      response: "Add OPENAI_API_KEY to enable live responses.",
    });
  }

  try {
    const prompts = await GPT_Router.getPromptsMap(promptsSource);
    const promptConfig = prompts?.[mode];
    if (!promptConfig) {
      console.error("[reader]", traceId, "missing prompt config for mode", mode);
      return respond({ response: "Unable to generate a response right now." }, 400);
    }

    const result = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: promptConfig.system },
          { role: "user", content: promptConfig.user },
        ],
        temperature: 0.2,
      }),
    });

    if (!result.ok) {
      const errorBody = await result.text();
      console.error("[reader]", traceId, "openai error", result.status, errorBody);
      return respond({ response: "Unable to generate a response right now." }, 500);
    }

    const data = (await result.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content?.trim();

    return respond({
      response: content ?? "No response received.",
    });
  } catch (error) {
    console.error("[reader]", traceId, "request failed", error);
    return respond({ response: "Unable to generate a response right now." }, 500);
  }
}
