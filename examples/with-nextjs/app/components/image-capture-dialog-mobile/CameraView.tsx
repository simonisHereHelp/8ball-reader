import { CameraOff, Loader2, RefreshCcw, Save, X } from "lucide-react";
import WebCamera from "@shivantra/react-web-camera";
import { Button } from "@/ui/components";
import type { CameraViewProps } from "./types";

export function CameraView({ state, actions, cameraRef }: CameraViewProps) {
  const isCamera = state.captureSource === "camera";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 relative p-0.5 min-h-0 flex flex-col">
        {/* Error Overlay */}
        {state.cameraError && isCamera && (
          <div className="flex flex-col items-center justify-center w-full h-full text-white/50 bg-black">
            <CameraOff className="w-12 h-12 mb-4" />
            <p>Camera unavailable.</p>
          </div>
        )}

        {/* Camera Feed */}
        {isCamera && !state.cameraError && (
          <WebCamera
            ref={cameraRef}
            className="w-full h-full object-cover"
            videoClassName="rounded-lg"
            captureMode="back"
            onError={() => actions.setCameraError(true)}
          />
        )}

        {state.summary && (
          <div className="absolute left-4 right-4 top-4 z-30">
            <div className="rounded-lg border border-white/20 bg-black/70 p-3 text-white">
              <p className="text-xs font-semibold text-blue-300 mb-2">
                Summary View
              </p>
              <p className="text-sm whitespace-pre-wrap">{state.summary}</p>
            </div>
          </div>
        )}

        {!state.summary && (
          <div className="absolute left-4 right-4 top-4 z-30">
            <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-white/70">
              <p className="text-xs font-semibold text-blue-300 mb-2">
                Summary View
              </p>
              <p className="text-sm">
                No summary yet. Tap Summarize to generate one.
              </p>
            </div>
          </div>
        )}

        {/* Floating Capture UI */}
        {isCamera && (
          <div className="absolute bottom-8 w-full px-8 flex items-center justify-end z-20">
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
        <Button
          onClick={actions.handleSummarize}
          disabled={state.isSaving || state.cameraError}
          className="app-button flex-1"
        >
          {state.isSaving ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}{" "}
          <span className="app-button-label">Summarize</span>
        </Button>
      </div>
    </div>
  );
}
