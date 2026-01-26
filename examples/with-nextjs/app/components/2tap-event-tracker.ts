"use client";

import { useEffect, useRef, useState } from "react";

export const useDoubleTapTracker = (
  targetRef: React.RefObject<HTMLElement>,
) => {
  const [isDoubleTap, setIsDoubleTap] = useState(false);
  const lastTapRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const handleTouchEnd = () => {
      const now = Date.now();
      if (now - lastTapRef.current <= 300) {
        setIsDoubleTap(true);
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
          setIsDoubleTap(false);
        }, 1000);
      }
      lastTapRef.current = now;
    };

    target.addEventListener("touchend", handleTouchEnd);

    return () => {
      target.removeEventListener("touchend", handleTouchEnd);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [targetRef]);

  return isDoubleTap;
};
