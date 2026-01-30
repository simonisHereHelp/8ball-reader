import type React from "react"; // Required for React.RefObject
import type { FacingMode, WebCameraHandler } from "@shivantra/react-web-camera";

export interface Image {
  url: string;
  file: File;
}

export interface State {
  images: Image[];
  facingMode: FacingMode;
  isSaving: boolean;
  isProcessingCapture: boolean;
  cameraError: boolean;
  captureSource: "camera" | "photos";
  summary: string;
  error: string;
}

export interface Actions {
  deleteImage: (index: number) => void;
  handleCameraSwitch: () => Promise<void>;
  handleSummarize: () => Promise<void>;
  handleClose: () => void;
  setCaptureSource: (source: "camera" | "photos") => void;
  setCameraError: (error: boolean) => void;
  setError: (message: string) => void;
}

export interface CameraViewProps {
  state: State;
  actions: Actions;
  cameraRef: React.RefObject<WebCameraHandler | null>;
}
