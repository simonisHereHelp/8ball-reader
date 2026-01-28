"use client";

export type ReaderResult = {
  ok: boolean;
  response: string;
  traceId?: string;
  detail?: string;
};

export const getReaderResponse = async (mode: string): Promise<ReaderResult> => {
  const response = await fetch("/api/reader", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });

  const traceId = response.headers.get("x-trace-id") ?? undefined;

  if (!response.ok) {
    let detail = "";
    try {
      const data = (await response.json()) as { response?: string };
      detail = data.response ?? "";
    } catch {
      detail = await response.text();
    }
    return {
      ok: false,
      response: "Unable to generate a response right now.",
      traceId,
      detail,
    };
  }

  const data = (await response.json()) as { response?: string };
  return {
    ok: true,
    response: data.response ?? "No response received.",
    traceId,
  };
};
