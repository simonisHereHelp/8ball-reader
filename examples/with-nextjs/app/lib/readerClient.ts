"use client";

export const getReaderResponse = async (mode: string) => {
  const now = new Date();
  const startTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  const startLine = `now starting readerClient ${startTime}`;
  const response = await fetch("/api/reader", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const data = (await response.json()) as Record<string, unknown>;
      detail = JSON.stringify(data);
    } catch {
      detail = await response.text();
    }
    const lines = [
      startLine,
      "Unable to generate a response right now.",
      `Status: ${response.status}`,
    ];
    if (detail) {
      lines.push(`Detail: ${detail}`);
    }
    return lines.join("\n");
  }

  const data = (await response.json()) as { response?: string };
  return [startLine, data.response ?? "No response received."].join("\n");
};
