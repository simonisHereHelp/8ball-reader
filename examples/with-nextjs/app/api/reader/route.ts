import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PROMPTS_MODE_READER_SOURCE } from "@/lib/jsonCanonSources";
import { GPT_Router } from "@/lib/gptRouter";

type ReaderRequest = {
  mode: string;
};

export async function POST(request: Request) {
  const traceId = crypto.randomUUID();

  const session = await auth();
  if (!session) {
    console.warn("[reader]", traceId, "missing session");
    return NextResponse.json(
      { response: "Authentication required." },
      { status: 401, headers: { "x-trace-id": traceId } },
    );
  }

  const { mode } = (await request.json()) as ReaderRequest;
  const apiKey = process.env.OPENAI_API_KEY;
  const promptsSource = PROMPTS_MODE_READER_SOURCE;

  console.info("[reader]", traceId, "mode", mode, "source", promptsSource);

  if (!apiKey) {
    console.warn("[reader]", traceId, "missing OPENAI_API_KEY");
    return NextResponse.json(
      { response: "Add OPENAI_API_KEY to enable live responses." },
      { headers: { "x-trace-id": traceId } },
    );
  }

  try {
    const prompts = await GPT_Router.getPromptsMap(promptsSource);
    const promptConfig = prompts?.[mode];
    if (!promptConfig) {
      console.error("[reader]", traceId, "missing prompt config for mode", mode);
      return NextResponse.json(
        { response: "Unable to generate a response right now." },
        { status: 400, headers: { "x-trace-id": traceId } },
      );
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
      return NextResponse.json(
        { response: "Unable to generate a response right now." },
        { status: 500, headers: { "x-trace-id": traceId } },
      );
    }

    const data = (await result.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content?.trim();

    return NextResponse.json(
      { response: content ?? "No response received." },
      { headers: { "x-trace-id": traceId } },
    );
  } catch (error) {
    console.error("[reader]", traceId, "request failed", error);
    return NextResponse.json(
      { response: "Unable to generate a response right now." },
      { status: 500, headers: { "x-trace-id": traceId } },
    );
  }
}
