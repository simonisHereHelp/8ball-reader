"use client";

import {
  Camera,
  CameraOff,
  ImageIcon,
  RefreshCcw,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import WebCamera from "@shivantra/react-web-camera";
import type { FacingMode, WebCameraHandler } from "@shivantra/react-web-camera";

import { Button, Dialog, DialogContent, DialogTitle } from "@/ui/components";

interface Image {
  url: string;
  file: File;
}

export function ImageCaptureDialogDesktop({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: () => void;
}) {
  const [images, setImages] = useState<Image[]>([]);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [cameraError, setCameraError] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTitle />
      <DialogContent className="p-0 border-0 !max-w-6xl !w-full h-[600px] max-h-[90vh] rounded-2xl overflow-hidden bg-slate-900/95 backdrop-blur-sm [&>button:last-child]:hidden">
        <div className="relative w-full h-full flex flex-col sm:flex-row overflow-hidden">
          {/* Camera Section */}
          <div className="flex-1 bg-slate-900 flex flex-col min-h-0 sm:min-h-full relative">
            {cameraError ? (
              <div className="flex flex-col items-center justify-center w-full h-full text-white/50">
                <CameraOff className="w-12 h-12 mb-4" />
                <p>Camera not available or permission denied.</p>
                <p className="text-sm">Please check your camera settings.</p>
              </div>
            ) : (
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
            )}

            {/* Capture Controls */}
            {!cameraError && (
              <div className="absolute inset-x-0 bottom-0 pb-4 flex items-center justify-center gap-3">
                <Button
                  onClick={handleCapture}
                  aria-label="Capture image"
                  className="app-button w-16 h-16 rounded-full border-4 border-white/50 shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  <Camera className="w-6 h-6" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleCameraSwitch}
                  aria-label="Switch camera"
                  className="app-button w-12 h-12 shadow-lg cursor-pointer"
                >
                  <RefreshCcw
                    className={`w-4 h-4 transition-transform duration-300 ${
                      facingMode === "user" ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </Button>
              </div>
            )}
          </div>

          {/* Gallery Section */}
          <div className="w-full sm:w-72 md:w-80 max-h-screen bg-slate-50 border-t sm:border-t-0 sm:border-l border-slate-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex-shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <h3 className="font-semibold text-sm sm:text-base">Gallery</h3>
                <span className="ml-auto text-xs sm:text-sm">
                  {images.length} {images.length === 1 ? "image" : "images"}
                </span>
              </div>
            </div>

            {/* Scrollable grid */}
            <div className="flex-grow overflow-y-auto p-3 sm:p-4 min-h-0">
              {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 mb-2" />
                  <p className="text-xs sm:text-sm text-slate-500">
                    No images captured yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-3 gap-2 sm:gap-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-300 transition-colors shadow-sm">
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={`Captured ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => deleteImage(index)}
                        aria-label={`Delete image ${index + 1}`}
                        className="app-button absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg cursor-pointer"
                      >
                        <X className="w-2 h-2 sm:w-3 sm:h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* footer buttons */}
            <div className="sticky bottom-0 bg-white p-3 sm:p-4 border-t border-slate-200 flex gap-2 flex-none">
              <Button
                onClick={handleClose}
                className="app-button flex-1 cursor-pointer"
              >
                <span className="app-button-label">Close</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImageCaptureDialogDesktop;
