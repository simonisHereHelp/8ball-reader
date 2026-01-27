import { NextResponse } from "next/server";
import { auth } from "@/auth";

type ReaderPrompt = {
  system: string;
  user: string;
};

type ReaderRequest = {
  prompt: ReaderPrompt;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { response: "Authentication required." },
      { status: 401 },
    );
  }

  const traceId = crypto.randomUUID();
  const { prompt } = (await request.json()) as ReaderRequest;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("[reader]", traceId, "missing OPENAI_API_KEY");
    return NextResponse.json({
      response: `Prompt received.\n\nSystem: ${prompt.system}\nUser: ${prompt.user}\n\nAdd OPENAI_API_KEY to enable live responses.`,
    });
  }

  try {
    const result = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        temperature: 0.2,
      }),
    });

    if (!result.ok) {
      const errorBody = await result.text();
      console.error("[reader]", traceId, "openai error", result.status, errorBody);
      return NextResponse.json(
        { response: "Unable to generate a response right now." },
        { status: 500 },
      );
    }

    const data = (await result.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({
      response: content ?? "No response received.",
    });
  } catch (error) {
    console.error("[reader]", traceId, "request failed", error);
    return NextResponse.json(
      { response: "Unable to generate a response right now." },
      { status: 500 },
    );
  }
}
