import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Kidsit AI";

// One shared card for both languages: brand marks only, so no Hebrew font
// has to be loaded into the renderer. The localized text ships as og:description.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          background: "#F3F6FF",
          color: "#26265E",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://kidsit.ai/logo.png" width={220} height={220} alt="" />
        <div style={{ fontSize: 84, fontWeight: 800 }}>Kidsit AI</div>
        <div style={{ fontSize: 40, color: "#5B3DF5" }}>
          Your AI parenting copilot
        </div>
      </div>
    ),
    size,
  );
}
