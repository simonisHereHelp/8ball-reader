export type HandLandmark = {
  x: number;
  y: number;
  z?: number;
};

const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const RING_PIP = 14;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_TIP = 20;

const EXTENDED_RATIO = 1.2;
const BENT_RATIO = 1.05;

const distance = (a: HandLandmark, b: HandLandmark): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.hypot(dx, dy, dz);
};

const isFingerExtended = (landmarks: HandLandmark[], mcp: number, pip: number, tip: number) => {
  const mcpPoint = landmarks[mcp];
  const pipPoint = landmarks[pip];
  const tipPoint = landmarks[tip];
  if (!mcpPoint || !pipPoint || !tipPoint) {
    return false;
  }
  const base = distance(pipPoint, mcpPoint);
  const extended = distance(tipPoint, mcpPoint);
  if (base === 0) {
    return false;
  }
  return extended / base >= EXTENDED_RATIO;
};

const isFingerBent = (landmarks: HandLandmark[], mcp: number, pip: number, tip: number) => {
  const mcpPoint = landmarks[mcp];
  const pipPoint = landmarks[pip];
  const tipPoint = landmarks[tip];
  if (!mcpPoint || !pipPoint || !tipPoint) {
    return false;
  }
  const base = distance(pipPoint, mcpPoint);
  const extended = distance(tipPoint, mcpPoint);
  if (base === 0) {
    return false;
  }
  return extended / base <= BENT_RATIO;
};

export const isTwoFingerPoint = (landmarks: HandLandmark[]): boolean => {
  if (!Array.isArray(landmarks) || landmarks.length < 21) {
    return false;
  }

  const indexExtended = isFingerExtended(landmarks, INDEX_MCP, INDEX_PIP, INDEX_TIP);
  const middleExtended = isFingerExtended(landmarks, MIDDLE_MCP, MIDDLE_PIP, MIDDLE_TIP);
  const ringBent = isFingerBent(landmarks, RING_MCP, RING_PIP, RING_TIP);
  const pinkyBent = isFingerBent(landmarks, PINKY_MCP, PINKY_PIP, PINKY_TIP);

  return indexExtended && middleExtended && ringBent && pinkyBent;
};
