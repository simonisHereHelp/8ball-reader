// app/components/image-capture-dialog-mobile/useImageCaptureState.ts

import { useRef, useState, useCallback, useEffect } from "react";
import type { WebCameraHandler, FacingMode } from "@shivantra/react-web-camera";
import { handleSummary } from "@/lib/handleSummary";
import {
  CaptureError,
  DEFAULTS,
  normalizeCapture,
} from "../shared/normalizeCapture";
import type { Image, State, Actions } from "./types";

interface UseImageCaptureState {
  state: State;
  actions: Actions;
  cameraRef: React.RefObject<WebCameraHandler | null>;
}

export const useImageCaptureState = (
  onOpenChange?: (open: boolean) => void,
  initialSource: "camera" | "photos" = "camera",
): UseImageCaptureState => {
  // --- Core State ---
  const [images, setImages] = useState<Image[]>([]);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingCapture, setIsProcessingCapture] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [captureSource, setCaptureSource] = useState<"camera" | "photos">(initialSource);

  // --- Summary & AI State ---
  const [summary, setSummary] = useState("");

  // --- UI Feedback State ---
  const [error, setError] = useState("");
  const cameraRef = useRef<WebCameraHandler | null>(null);
  const imagesRef = useRef<Image[]>([]);

  // Keep capture source in sync with props
  useEffect(() => {
    setCaptureSource(initialSource);
  }, [initialSource]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // --- Handlers ---

  const deleteImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClose = useCallback(() => {
    if (images.length > 0 && !isSaving) {
      if (!window.confirm("You have unsaved images. Are you sure you want to close?")) {
        return;
      }
    }
    // Reset all state
    setImages([]);
    setSummary("");
    setError("");
    setShowGallery(false);
    setCaptureSource(initialSource);
    setIsProcessingCapture(false);
    onOpenChange?.(false);
  }, [images.length, initialSource, isSaving, onOpenChange]);

  const summarizeImages = useCallback(
    async (nextImages: Image[]) => {
      await handleSummary({
        images: nextImages,
        setIsSaving,
        setSummary,
        setError,
      });
    },
    [setIsSaving, setSummary, setError],
  );

  const ingestFile = useCallback(
    async (file: File, source: "camera" | "photos", preferredName?: string) => {
      setIsProcessingCapture(true);
      setError("");
      try {
        const { file: normalizedFile, previewUrl } = await normalizeCapture(file, source, {
          maxFileSize: DEFAULTS.MAX_FILE_SIZE,
          preferredName,
        });

        const nextImages = [...imagesRef.current, { url: previewUrl, file: normalizedFile }];
        setSummary("");
        setShowGallery(true);
        setImages(nextImages);
        await summarizeImages(nextImages);
      } catch (err) {
        setError(err instanceof CaptureError ? err.message : "Unable to process the image.");
      } finally {
        setIsProcessingCapture(false);
      }
    },
    [summarizeImages],
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const file = await cameraRef.current.capture();
      if (file) await ingestFile(file, "camera", `capture-${Date.now()}.jpeg`);
    } catch (err) {
      setError("Unable to access camera capture.");
    }
  }, [ingestFile]);

  const handleAlbumSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await ingestFile(files[0], "photos");
  }, [ingestFile]);

  const handleCameraSwitch = useCallback(async () => {
    if (!cameraRef.current) return;
    const newMode = facingMode === "user" ? "environment" : "user";
    await cameraRef.current.switch(newMode);
    setFacingMode(newMode);
  }, [facingMode]);

  const handleSummarize = useCallback(async () => {
    setError("");
    await handleSummary({
      images,
      setIsSaving,
      setSummary,
      setError,
    });
  }, [images, setIsSaving, setSummary, setError]);

  // --- Aggregate State & Actions ---

  const state: State = {
    images,
    facingMode,
    isSaving,
    isProcessingCapture,
    showGallery,
    cameraError,
    captureSource,
    summary,
    error,
  };

  const actions: Actions = {
    deleteImage,
    handleCapture,
    handleAlbumSelect,
    handleCameraSwitch,
    handleSummarize,
    handleClose,
    setCaptureSource,
    setShowGallery,
    setCameraError,
    setError,
  };

  return { state, actions, cameraRef };
};
