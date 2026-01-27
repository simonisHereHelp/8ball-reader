import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: -3,
        }}
      >
        XR
      </div>
    ),
    {
      ...size,
    },
  );
}
