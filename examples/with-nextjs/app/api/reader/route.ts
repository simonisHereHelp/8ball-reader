import { NextResponse } from "next/server";
import { PROMPTS_MODE_READER_SOURCE } from "@/lib/jsonCanonSources";
import { GPT_Router } from "@/lib/gptRouter";

type ReaderRequest = {
  mode: string;
};

export async function POST(request: Request) {
  const { mode } = (await request.json()) as ReaderRequest;
  const promptsSource = PROMPTS_MODE_READER_SOURCE;

  try {
    const prompts = await GPT_Router.getPromptsMap(promptsSource);
    const promptConfig = prompts?.[mode];
    if (!promptConfig) {
      return NextResponse.json(
        { response: "Unable to generate a response right now." },
        { status: 400 },
      );
    }

    const { response, traceId } = await GPT_Router.getGPTResponse(
      promptConfig.system,
      promptConfig.user,
    );

    return NextResponse.json(
      { response },
      { headers: traceId ? { "x-trace-id": traceId } : undefined },
    );
  } catch (error) {
    const traceId =
      (error as Error & { traceId?: string }).traceId ?? undefined;
    return NextResponse.json(
      { response: "Unable to generate a response right now." },
      { status: 500, headers: traceId ? { "x-trace-id": traceId } : undefined },
    );
  }
}
