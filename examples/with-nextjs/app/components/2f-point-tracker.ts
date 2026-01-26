"use client";

import { useEffect, useRef, useState } from "react";

type HandLandmark = { x: number; y: number; z?: number };
type HandsConstructor = new (options: {
  locateFile: (file: string) => string;
}) => {
  close: () => void;
  onResults: (cb: (results: any) => void) => void;
  send: (args: { image: HTMLVideoElement }) => Promise<void>;
  setOptions: (options: Record<string, unknown>) => void;
};

const INDEX_TIP = 8;
const INDEX_PIP = 6;
const INDEX_MCP = 5;
const MIDDLE_TIP = 12;
const MIDDLE_PIP = 10;
const MIDDLE_MCP = 9;

const isFingerExtended = (
  landmarks: HandLandmark[],
  tipIndex: number,
  pipIndex: number,
) => landmarks[tipIndex]?.y < landmarks[pipIndex]?.y;

const distance2D = (a: HandLandmark, b: HandLandmark) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const areFingertipsClose = (landmarks: HandLandmark[]) => {
  const indexTip = landmarks[INDEX_TIP];
  const middleTip = landmarks[MIDDLE_TIP];
  if (!indexTip || !middleTip) return false;
  return distance2D(indexTip, middleTip) < 0.04;
};

const areNailsFacingCamera = (landmarks: HandLandmark[]) => {
  const indexTip = landmarks[INDEX_TIP];
  const middleTip = landmarks[MIDDLE_TIP];
  const indexMcp = landmarks[INDEX_MCP];
  const middleMcp = landmarks[MIDDLE_MCP];
  if (!indexTip || !middleTip || !indexMcp || !middleMcp) return false;

  const tipZ = (indexTip.z ?? 0) + (middleTip.z ?? 0);
  const mcpZ = (indexMcp.z ?? 0) + (middleMcp.z ?? 0);
  return tipZ < mcpZ;
};

const isTwoFingerPoint = (landmarks: HandLandmark[] | undefined) => {
  if (!landmarks) return false;

  const indexExtended = isFingerExtended(landmarks, INDEX_TIP, INDEX_PIP);
  const middleExtended = isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP);
  const fingertipsTogether = areFingertipsClose(landmarks);
  const nailsFacingCamera = areNailsFacingCamera(landmarks);

  return indexExtended && middleExtended && fingertipsTogether && nailsFacingCamera;
};

let handsScriptPromise: Promise<HandsConstructor> | null = null;

const loadHandsModule = () => {
  if (handsScriptPromise) {
    return handsScriptPromise;
  }

  handsScriptPromise = new Promise<HandsConstructor>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("MediaPipe Hands requires a browser environment."));
      return;
    }

    const existing = (window as typeof window & { Hands?: HandsConstructor })
      .Hands;
    if (existing) {
      resolve(existing);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
    script.async = true;
    script.onload = () => {
      const HandsConstructor =
        (window as typeof window & { Hands?: HandsConstructor }).Hands;
      if (HandsConstructor) {
        resolve(HandsConstructor);
      } else {
        reject(new Error("MediaPipe Hands failed to load."));
      }
    };
    script.onerror = () =>
      reject(new Error("Unable to load MediaPipe Hands script."));
    document.head.appendChild(script);
  });

  return handsScriptPromise;
};

export const useTwoFingerPointTracker = (video: HTMLVideoElement | null) => {
  const [isPointing, setIsPointing] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!video) {
      setIsPointing(false);
      return;
    }

    let active = true;
    let handsInstance:
      | {
          close: () => void;
          onResults: (cb: (results: any) => void) => void;
          send: (args: { image: HTMLVideoElement }) => Promise<void>;
          setOptions: (options: Record<string, unknown>) => void;
        }
      | null = null;

    const startTracking = async () => {
      const Hands = await loadHandsModule();
      if (!active) return;

      handsInstance = new Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      handsInstance.onResults((results: { multiHandLandmarks?: HandLandmark[][] }) => {
        if (!active) return;
        const landmarks = results.multiHandLandmarks?.[0];
        setIsPointing(isTwoFingerPoint(landmarks));
      });

      const processFrame = async () => {
        if (!active || !handsInstance) return;
        if (video.readyState >= 2) {
          await handsInstance.send({ image: video });
        }
        rafRef.current = requestAnimationFrame(processFrame);
      };

      processFrame();
    };

    startTracking();

    return () => {
      active = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      handsInstance?.close();
    };
  }, [video]);

  return isPointing;
};
