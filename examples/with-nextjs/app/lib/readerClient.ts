"use client";

const fileToDataUrl = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  const base64 = btoa(binary);
  const mimeType = file.type || "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
};

export const getReaderResponse = async (mode: string, imageFile?: File) => {
  const now = new Date();
  const startTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  const startLine = `now starting readerClient ${startTime}`;
  const imageData = imageFile ? await fileToDataUrl(imageFile) : undefined;
  const response = await fetch("/api/reader", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, imageData }),
  });
  const latencyMs = Math.round(performance.now() - startMs);
  const latencyLine = `latency ms ${latencyMs}`;

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

  const data = (await response.json()) as { response?: unknown };
  const responseText =
    typeof data.response === "string" && data.response.length > 0
      ? data.response
      : JSON.stringify(data);
  return [startLine, responseText || "No response received."].join("\n");
};
