"use client";

export const getReaderResponse = async (mode: string) => {
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
    const now = new Date();
    const startTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    const lines = [
      `now starting readerClient ${startTime}`,
      "Unable to generate a response right now.",
      `Status: ${response.status}`,
    ];
    if (detail) {
      lines.push(`Detail: ${detail}`);
    }
    return lines.join("\n");
  }

  const data = (await response.json()) as { response?: string };
  return data.response ?? "No response received.";
};
