export function isTwoFingerPoint(landmarks) {
  if (!Array.isArray(landmarks)) {
    return false;
  }

  if (landmarks.length < 2) {
    return false;
  }

  const [first, second] = landmarks;
  if (!first || !second) {
    return false;
  }

  const firstHasPoint = typeof first.x === "number" && typeof first.y === "number";
  const secondHasPoint = typeof second.x === "number" && typeof second.y === "number";

  return firstHasPoint && secondHasPoint;
}
