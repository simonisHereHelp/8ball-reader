"use client";

import prompts from "./prompts_mode_reader.json";

type ReaderMode = keyof typeof prompts;

const fallbackPrompt = {
  system: "You are a reading assistant for books.",
  user: "Read the content shown on the screen.",
};

export const getReaderPrompt = (mode: string) => {
  const prompt = (prompts as Record<string, typeof fallbackPrompt>)[mode];
  return prompt ?? fallbackPrompt;
};

export const getReaderResponse = async (prompt: {
  system: string;
  user: string;
}) => {
  const response = await fetch("/api/reader", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    return "Unable to generate a response right now.";
  }

  const data = (await response.json()) as { response?: string };
  return data.response ?? "No response received.";
};

export const savePromptsToDrive = async () => {
  const response = await fetch("/api/prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompts }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { link?: string };
  return data.link ?? null;
};

export type { ReaderMode };
