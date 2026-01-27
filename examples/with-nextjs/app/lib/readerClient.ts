"use client";

export const getReaderResponse = async (mode: string) => {
  const response = await fetch("/api/reader", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });

  if (!response.ok) {
    return "Unable to generate a response right now.";
  }

  const data = (await response.json()) as { response?: string };
  return data.response ?? "No response received.";
};
