// app/lib/handleSave.ts (-)

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
  summary,
  setIsSaving,
  onError,
  onSuccess,
}: {
  images: Image[];
  summary: string;
  setIsSaving: (isSaving: boolean) => void;
  onError?: (message: string) => void;
  onSuccess?: (setName: string) => void;
}) => {
  // nothing to save
  if (!images.length) return;

  const trimmedSummary = summary.trim();
  if (!trimmedSummary) return;

  setIsSaving(true);

  try {
    const formData = new FormData();

    // let the server derive setName from summary
    formData.append("summary", trimmedSummary);

    // summary file — server will rename it to setName.json
    const summaryFile = new File(
      [JSON.stringify({ summary: trimmedSummary }, null, 2)],
      "summary.json",
      { type: "application/json" },
    );
    formData.append("files", summaryFile);

    // all captured images — server will rename to {setName}-pX.ext or similar
    images.forEach((image) => {
      formData.append("files", image.file);
    });

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
    
    const finalSetName = json?.setName ?? "";

    // 2️⃣ hello-world trial: ping /api/update-canonicals
    try {
                // Call the endpoint. The browser must send session cookies.
                const response = await fetch("/api/update-canonicals", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    // 'include' ensures cookies (like next-auth session cookie) are sent
                    credentials: "include" 
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Server Error: ${response.status} - ${errorData.error}`);
                }

                const result = await response.json();
                console.log("Success:", result);
    } catch (e) {
      // canonicals update should not block main save flow
      console.error("Error calling /api/update-canonicals:", e);
    }


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
