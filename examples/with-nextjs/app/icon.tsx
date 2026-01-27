import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 128,
          fontWeight: 700,
          letterSpacing: -6,
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
