"use client";

export const getReaderResponse = async (mode: string) => {
  const response = await fetch("/api/reader", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });

  if (!response.ok) {
    const traceId = response.headers.get("x-trace-id");
    let detail = "";
    try {
      const data = (await response.json()) as { response?: string };
      detail = data.response ?? "";
    } catch {
      detail = await response.text();
    }
    const suffix = traceId ? ` (trace ${traceId})` : "";
    return `Unable to generate a response right now.${suffix}${detail ? ` ${detail}` : ""}`;
  }

  const data = (await response.json()) as { response?: string };
  return data.response ?? "No response received.";
};
