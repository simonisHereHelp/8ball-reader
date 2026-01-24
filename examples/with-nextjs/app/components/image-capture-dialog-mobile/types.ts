import type React from "react"; // Required for React.RefObject
import type { FacingMode, WebCameraHandler } from "@shivantra/react-web-camera";

export interface Image {
  url: string;
  file: File;
}

export interface State {
  images: Image[];
  facingMode: FacingMode;
  isProcessingCapture: boolean;
  showGallery: boolean;
  cameraError: boolean;
  error: string;
}

export interface Actions {
  deleteImage: (index: number) => void;
  handleCapture: () => Promise<void>;
  handleCameraSwitch: () => Promise<void>;
  handleClose: () => void;
  setShowGallery: (show: boolean) => void;
  setCameraError: (error: boolean) => void;
  setError: (message: string) => void;
}

export interface CameraViewProps {
  state: State;
  actions: Actions;
  cameraRef: React.RefObject<WebCameraHandler | null>;
}
