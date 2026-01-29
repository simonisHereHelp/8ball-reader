import { Camera, CameraOff, Loader2, RefreshCcw, Save, X } from "lucide-react";
import WebCamera from "@shivantra/react-web-camera";
import { Button } from "@/ui/components";
import type { CameraViewProps } from "./types";

export function CameraView({ state, actions, cameraRef }: CameraViewProps) {
  const latestImage = state.images[state.images.length - 1];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 relative p-0.5 min-h-0 flex flex-col">
        {/* Error Overlay */}
        {state.cameraError && (
          <div className="flex flex-col items-center justify-center w-full h-full text-white/50 bg-black">
            <CameraOff className="w-12 h-12 mb-4" />
            <p>Camera unavailable.</p>
          </div>
        )}

        {/* Camera Feed */}
        {!state.cameraError && (
          <WebCamera
            ref={cameraRef}
            className="w-full h-full object-cover"
            videoClassName="rounded-lg"
            captureMode="back"
            onError={() => actions.setCameraError(true)}
          />
        )}

        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="w-[85%] max-w-sm rounded-xl border border-white/20 bg-black/70 p-4 text-sm text-white shadow-lg">
            <div className="text-xs font-bold text-blue-200 mb-2">SUMMARY</div>
            <div className="max-h-40 overflow-y-auto whitespace-pre-wrap">
              {state.summary || "Capture an image to generate a summary."}
            </div>
          </div>
        </div>

        {/* Floating Capture UI */}
        <div className="absolute bottom-8 w-full px-8 flex items-center justify-between z-20">
          <button
            onClick={() => actions.setShowGallery(true)}
            className="app-button w-16 h-16 rounded-xl border-2 border-white/30 overflow-hidden"
          >
            {latestImage ? <img src={latestImage.url} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
          </button>
          
          <Button onClick={actions.handleCapture} disabled={state.isSaving || state.cameraError} className="app-button w-20 h-20 rounded-full border-4 border-white/50">
            <Camera className="w-8 h-8" />
          </Button>

          <Button onClick={actions.handleCameraSwitch} className="app-button w-16 h-16 rounded-full">
            <RefreshCcw className={`transition-transform ${state.facingMode === 'user' ? 'rotate-180' : ''}`} />
          </Button>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-black/80 flex gap-2">
        <Button onClick={actions.handleClose} className="app-button flex-1">
          <X className="mr-2 h-4 w-4" /> <span className="app-button-label">Cancel</span>
        </Button>
        <Button onClick={actions.handleSummarize} disabled={state.images.length === 0} className="app-button flex-1">
          {state.isSaving ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}{" "}
          <span className="app-button-label">Summarize</span>
        </Button>
      </div>

      <input id="photo-picker" type="file" accept="image/*" className="hidden" onChange={(e) => actions.handleAlbumSelect(e.target.files)} />
    </div>
  );
}
