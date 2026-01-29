import type { RefObject } from "react";
import type { WebCameraHandler } from "@shivantra/react-web-camera";
import { Camera, Image as ImageIcon, RefreshCcw, X } from "lucide-react";
import WebCamera from "@shivantra/react-web-camera";
import { Button } from "@/ui/components";
import type { Actions, State } from "./types";

export function GalleryView({
  state,
  actions,
  cameraRef,
}: {
  state: State;
  actions: Actions;
  cameraRef: RefObject<WebCameraHandler | null>;
}) {
  const isCamera = state.captureSource === "camera";
  const latestImage = state.images[state.images.length - 1];

  return (
    <div className="absolute inset-0 bg-black/95 z-40 flex flex-col">
      <div className="flex justify-between p-4 border-b border-white/10">
        <h3 className="text-white font-bold">{state.images.length} Photos</h3>
        <button
          onClick={actions.handleClose}
          className="app-button h-8 w-8 rounded-full flex items-center justify-center"
        >
          <X />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="relative w-full overflow-hidden rounded-lg bg-black">
          {isCamera && !state.cameraError && (
            <WebCamera
              ref={cameraRef}
              className="w-full h-full object-cover"
              videoClassName="rounded-lg"
              captureMode="back"
              onError={() => actions.setCameraError(true)}
            />
          )}
          {state.cameraError && isCamera && (
            <div className="flex flex-col items-center justify-center w-full h-[260px] text-white/50 bg-black">
              <p>Camera unavailable.</p>
            </div>
          )}
          {!isCamera && (
            <div className="relative w-full h-[260px] rounded-lg bg-black flex items-center justify-center">
              {latestImage ? (
                <img src={latestImage.url} className="max-h-full object-contain" alt="Preview" />
              ) : (
                <div className="text-white/60 text-center">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                  <p>Pick a photo</p>
                </div>
              )}
            </div>
          )}

          {isCamera && (
            <div className="absolute bottom-4 w-full px-6 flex items-center justify-between">
              <button
                onClick={() => actions.setCaptureSource("photos")}
                className="app-button w-12 h-12 rounded-xl border-2 border-white/30 overflow-hidden"
              >
                {latestImage ? (
                  <img src={latestImage.url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </button>

              <Button
                onClick={actions.handleCapture}
                disabled={state.isSaving || state.cameraError}
                className="app-button w-16 h-16 rounded-full border-4 border-white/50"
              >
                <Camera className="w-6 h-6" />
              </Button>

              <Button onClick={actions.handleCameraSwitch} className="app-button w-12 h-12 rounded-full">
                <RefreshCcw
                  className={`transition-transform ${state.facingMode === "user" ? "rotate-180" : ""}`}
                />
              </Button>
            </div>
          )}

          {!isCamera && (
            <div className="absolute bottom-4 w-full px-6 flex items-center justify-between">
              <Button onClick={() => actions.setCaptureSource("camera")} className="app-button w-12 h-12 rounded-full">
                <Camera className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => document.getElementById("photo-picker")?.click()}
                className="app-button flex-1 ml-3"
              >
                Choose Photo
              </Button>
            </div>
          )}
        </div>

        {/* Responsive Image Grid */}
        <div className="grid grid-cols-2 gap-2">
          {state.images.map((img, i) => (
            <div key={i} className="relative aspect-square bg-white/5 rounded-lg overflow-hidden">
              <img src={img.url} className="object-contain w-full h-full" />
              <button
                onClick={() => actions.deleteImage(i)}
                className="app-button absolute top-1 right-1 h-6 w-6 rounded-full flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-blue-300">VIEW SUMMARY</label>
            <div className="w-full min-h-[150px] whitespace-pre-wrap bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white">
              {state.summary || "No summary yet. Capture an image to generate one."}
            </div>
          </div>
        </div>
      </div>

      <input
        id="photo-picker"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => actions.handleAlbumSelect(e.target.files)}
      />
    </div>
  );
}
