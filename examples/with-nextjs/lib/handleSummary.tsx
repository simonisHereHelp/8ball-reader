// app/lib/handleSummary.ts

import { playSuccessChime } from "../app/components/image-capture-dialog-mobile/soundEffects";

export interface Image {
  url: string;
  file: File;
}

/**
 * Uploads the images to /api/summarize and shows the returned summary.
 */

export const handleSummary = async ({
  images,
  setIsSaving,
  setSummary,
  setError,
}: {
  images: Image[];
  setIsSaving: (isSaving: boolean) => void;
  setSummary: (summary: string) => void;
  setError: (message: string) => void;
}): Promise<boolean> => {
  if (images.length === 0) return false;

  setIsSaving(true);
  setError("");
  try {
    const formData = new FormData();

    // ✅ append ALL images
    images.forEach((image) => {
      formData.append("image", image.file);
    });

    // ✅ optionally include URLs if your server supports imageUrl
    images.forEach((image) => {
      if (image.url) {
        formData.append("imageUrl", image.url);
      }
    });
    
    const response = await fetch("/api/summarize", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to summarize image.");
    }

    const data = (await response.json()) as { summary?: string };
    setSummary((data.summary || "").trim());
    playSuccessChime();
    return true;
  } catch (error) {
    console.error("Failed to summarize image:", error);
    setSummary("");
    setError("Unable to summarize the captured image. Please try again.");
    return false;
  } finally {
    setIsSaving(false);
  }
};
