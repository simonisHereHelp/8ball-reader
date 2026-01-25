"use client";

import { Camera, CameraOff, RefreshCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import WebCamera from "@shivantra/react-web-camera";
import type { FacingMode, WebCameraHandler } from "@shivantra/react-web-camera";
import {
  isTwoFingerPoint,
  type HandLandmarks,
} from "@simonisHereHelp/two-finger-point";

import { Button, Dialog, DialogContent, DialogTitle } from "@/app/component";

interface Image {
  url: string;
  file: File;
}

export function ImageCaptureDialogMobile({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: () => void;
}) {
  const [images, setImages] = useState<Image[]>([]);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [showGallery, setShowGallery] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [landmarks, setLandmarks] = useState<HandLandmarks | null>(null);
  const isPointing = useMemo(
    () => isTwoFingerPoint(landmarks),
    [landmarks],
  );

  const cameraRef = useRef<WebCameraHandler | null>(null);

  /**
   * Removes an image from the gallery based on its index.
   * @param index The index of the image to be deleted.
   */
  const deleteImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Handles the dialog close action. It prompts the user for confirmation
   * if there are unsaved images to prevent data loss.
   */
  const handleClose = () => {
    if (images.length > 0) {
      if (
        !window.confirm(
          "You have unsaved images. Are you sure you want to close?"
        )
      ) {
        return;
      }
    }
    setImages([]);
    onOpenChange?.();
  };

  /**
   * Captures an image from the webcam and adds it to the gallery.
   */
  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const file = await cameraRef.current.capture();
      if (file) {
        const url = URL.createObjectURL(file);
        setImages((prev) => [...prev, { url, file }]);
      }
    } catch (error) {
      console.error("Capture error:", error);
    }
  };

  /**
   * Switches the camera between front-facing ('user') and back-facing ('environment').
   */
  const handleCameraSwitch = async () => {
    if (!cameraRef.current) return;
    try {
      const newMode = facingMode === "user" ? "environment" : "user";
      await cameraRef.current.switch(newMode);
      setFacingMode(newMode);
    } catch (error) {
      console.error("Camera switch error:", error);
    }
  };

  useEffect(() => {
    const handleLandmarks = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const nextLandmarks = detail?.landmarks ?? detail ?? null;

      setLandmarks(Array.isArray(nextLandmarks) ? nextLandmarks : null);
    };

    window.addEventListener("two-finger-point", handleLandmarks as EventListener);
    return () => {
      window.removeEventListener(
        "two-finger-point",
        handleLandmarks as EventListener,
      );
    };
  }, []);

  return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTitle />
        <DialogContent className="p-0 border-0 bg-black max-w-none w-full h-full max-h-none sm:max-w-sm sm:w-[380px] sm:h-[680px] sm:rounded-[2rem] overflow-hidden [&>button:last-child]:hidden">
          <div className="relative w-full h-full flex flex-col bg-black sm:rounded-[2rem]">
            {/* Camera View */}
            <div className="flex-1 relative p-0.5">
            {cameraError ? (
              <div className="flex flex-col items-center justify-center w-full h-full text-white/50">
                <CameraOff className="w-12 h-12 mb-4" />
                <p>Camera not available or permission denied.</p>
                <p className="text-sm">Please check your camera settings.</p>
              </div>
            ) : (
              <>
                <WebCamera
                  ref={cameraRef}
                  className="w-full h-full object-cover"
                  style={{ backgroundColor: "black" }}
                  videoClassName="rounded-lg"
                  videoStyle={{ objectFit: "cover" }}
                  captureMode="back"
                  captureType="jpeg"
                  captureQuality={0.8}
                  getFileName={() => `capture-${Date.now()}.jpeg`}
                  onError={(err) => {
                    console.error("Camera error:", err);
                    setCameraError(true);
                  }}
                />
                <div className="absolute top-4 left-4 z-30 rounded-lg bg-black/60 px-3 py-2 text-xs font-medium text-white">
                  <p className="uppercase tracking-wide text-white/70">
                    Live feed
                  </p>
                  <p>Two-finger point: {String(isPointing)}</p>
                </div>
              </>
            )}

            <div className="absolute bottom-8 left-0 right-0 px-8">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 cursor-pointer">
                  {images.length > 0 ? (
                    <button
                      onClick={() => setShowGallery(true)}
                      className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white/30 bg-black/50 backdrop-blur-sm"
                    >
                      <img
                        src={
                          images[images.length - 1].url || "/placeholder.svg"
                        }
                        alt="Latest"
                        className="w-full h-full object-cover"
                      />
                      {images.length > 1 && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-none flex items-center justify-center">
                          <div className="text-white text-sm rounded-full w-8 h-8 flex items-center justify-center font-bold">
                            +{images.length - 1}
                          </div>
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className="w-full h-full rounded-2xl border-2 border-white/20 bg-black/20 backdrop-blur-sm"></div>
                  )}
                </div>

                <Button
                  onClick={handleCapture}
                  className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 text-black shadow-2xl border-4 border-white/50 cursor-pointer"
                >
                  <Camera className="!w-8 !h-8" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCameraSwitch}
                  className="w-16 h-16 bg-white/20 border border-white/30 text-white hover:bg-white/30 backdrop-blur-md transition cursor-pointer"
                >
                  <RefreshCcw
                    className={`w-6 h-6 transition-transform duration-300 ${
                      facingMode === "user" ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 bg-gradient-to-t from-black/80 to-transparent mb-2">
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
          {/* Gallery Modal */}
          {showGallery && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 sm:rounded-[2rem] flex flex-col">
              {/* Gallery Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <h3 className="text-white text-lg font-semibold">
                  {images.length} Photo{images.length !== 1 ? "s" : ""}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowGallery(false)}
                  className="text-white hover:bg-white/20 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Gallery Grid */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden border border-white/20">
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        onClick={() => deleteImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg p-0 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gallery Footer */}
              <div className="p-4 border-t border-white/20">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setImages([])}
                    disabled={images.length === 0}
                    className="flex-1 bg-red-500/20 border-red-500/30 text-white hover:bg-red-500/30 hover:text-white"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImageCaptureDialogMobile;
