// app/components/image-capture-dialog-mobile/useImageCaptureState.ts

import { useRef, useState, useCallback } from "react";
import type { WebCameraHandler, FacingMode } from "@shivantra/react-web-camera";
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
): UseImageCaptureState => {
  // --- Core State ---
  const [images, setImages] = useState<Image[]>([]);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [isProcessingCapture, setIsProcessingCapture] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [error, setError] = useState("");
  const [readerResponse, setReaderResponse] = useState("");
  const [readerDebugLines, setReaderDebugLines] = useState<string[]>([]);

  const cameraRef = useRef<WebCameraHandler | null>(null);

  // --- Handlers ---

  const deleteImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClose = useCallback(() => {
    if (images.length > 0) {
      if (!window.confirm("You have unsaved images. Are you sure you want to close?")) {
        return;
      }
    }
    // Reset all state
    setImages([]);
    setError("");
    setReaderResponse("");
    setReaderDebugLines([]);
    setShowGallery(false);
    setIsProcessingCapture(false);
    onOpenChange?.(false);
  }, [images.length, onOpenChange]);

  const ingestFile = useCallback(
    async (file: File, preferredName?: string) => {
      setIsProcessingCapture(true);
      setError("");
      try {
        const { file: normalizedFile, previewUrl } = await normalizeCapture(file, "camera", {
          maxFileSize: DEFAULTS.MAX_FILE_SIZE,
          preferredName,
        });

        setShowGallery(false);
        setImages((prev) => [...prev, { url: previewUrl, file: normalizedFile }]);
      } catch (err) {
        setError(err instanceof CaptureError ? err.message : "Unable to process the image.");
      } finally {
        setIsProcessingCapture(false);
      }
    },
    [],
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const file = await cameraRef.current.capture();
      if (file) await ingestFile(file, `capture-${Date.now()}.jpeg`);
    } catch (err) {
      setError("Unable to access camera capture.");
    }
  }, [ingestFile]);

  const handleCameraSwitch = useCallback(async () => {
    if (!cameraRef.current) return;
    const newMode = facingMode === "user" ? "environment" : "user";
    await cameraRef.current.switch(newMode);
    setFacingMode(newMode);
  }, [facingMode]);

  // --- Aggregate State & Actions ---

  const state: State = {
    images,
    facingMode,
    isProcessingCapture,
    showGallery,
    cameraError,
    error,
    readerResponse,
    readerDebugLines,
  };

  const actions: Actions = {
    deleteImage,
    handleCapture,
    handleCameraSwitch,
    handleClose,
    setShowGallery,
    setCameraError,
    setError,
    setReaderResponse,
    addReaderDebugLine: (message: string) =>
      setReaderDebugLines((prev) => [...prev, message]),
    clearReaderDebugLines: () => setReaderDebugLines([]),
  };

  return { state, actions, cameraRef };
};
