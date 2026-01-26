import { Camera, CameraOff, RefreshCcw, X } from "lucide-react";
import { useRef } from "react";
import WebCamera from "@shivantra/react-web-camera";
import { Button } from "@/ui/components";
import type { CameraViewProps } from "./types";
import { useDoubleTapTracker } from "../2tap-event-tracker";

export function CameraView({ state, actions, cameraRef }: CameraViewProps) {
  const latestImage = state.images[state.images.length - 1];
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const isDoubleTap = useDoubleTapTracker(cameraContainerRef);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={cameraContainerRef}
        className="flex-1 relative p-0.5 min-h-0 flex flex-col"
      >
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

        {!state.cameraError && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {isDoubleTap ? "LIVE STREAM..tap x 2" : "LIVE STREAM listening..."}
          </div>
        )}

        {/* Floating Capture UI */}
        {!state.cameraError && (
          <div className="absolute bottom-8 w-full px-8 flex items-center justify-between z-20">
             <button
               onClick={() => actions.setShowGallery(true)}
               className="app-button w-16 h-16 rounded-xl border-2 border-white/30 overflow-hidden"
             >
                {latestImage ? <img src={latestImage.url} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
             </button>
             
             <Button onClick={actions.handleCapture} disabled={state.cameraError} className="app-button w-20 h-20 rounded-full border-4 border-white/50">
               <Camera className="w-8 h-8" />
             </Button>

             <Button onClick={actions.handleCameraSwitch} className="app-button w-16 h-16 rounded-full">
               <RefreshCcw className={`transition-transform ${state.facingMode === 'user' ? 'rotate-180' : ''}`} />
             </Button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-black/80 flex gap-2">
        <Button onClick={actions.handleClose} className="app-button flex-1">
          <X className="mr-2 h-4 w-4" /> <span className="app-button-label">Cancel</span>
        </Button>
      </div>
    </div>
  );
}
