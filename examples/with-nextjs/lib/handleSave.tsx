// app/lib/handleSave.ts

export interface Image {
  url: string;
  file: File;
}

/**
 * Saves the current images + summary via /api/save-set.
 * The server (via ChatGPT) is responsible for deriving setName.
 */
export const handleSave = async ({
  images,
  draftSummary, // Retained in function signature to match caller, but ignored in body logic
  editableSummary, 
  setIsSaving,
  onError,
  onSuccess,
}: {
  images: Image[];
  draftSummary: string; // Original LLM output (Ignored for JSON/POST body content)
  editableSummary: string; // Edited and final content
  setIsSaving: (isSaving: boolean) => void;
  onError?: (message: string) => void;
  onSuccess?: (setName: string) => void;
}) => {
  // nothing to save
  if (!images.length) return;

  const finalSummary = editableSummary.trim();
  // Check against the final edited summary
  if (!finalSummary) return;

  setIsSaving(true);

  try {
    const formData = new FormData();

    // 1. Send the edited summary as the 'summary' form field (used for setName derivation)
    formData.append("summary", finalSummary);

    // 2. summary.json file — server will rename it to setName.json
    // JSON content now includes ONLY the 'summary' (final edited content), as requested.
    const summaryFile = new File(
      [JSON.stringify({ summary: finalSummary }, null, 2)],
      "summary.json",
      { type: "application/json" },
    );
    formData.append("files", summaryFile);

    // 3. all captured images — server will rename to {setName}-pX.ext or similar
    images.forEach((image) => {
      formData.append("files", image.file);
    });

    // API call to the correct endpoint
    const response = await fetch("/api/save-set", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to save files to Google Drive.");
    }

    const json = (await response.json().catch(() => null)) as
      | { setName?: string }
      | null;

    // 🔔 let the UI know the final server-side setName (if provided)
    if (onSuccess) {
      onSuccess(json?.setName ?? "");
    }
    
  } catch (error) {
    console.error("Failed to save images:", error);
    onError?.("Unable to save captured images. Please try again.");
  } finally {
    setIsSaving(false);
  }
};