export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

export type HandLandmarks = Landmark[];

export declare function isTwoFingerPoint(
  landmarks: HandLandmarks | null | undefined
): boolean;
