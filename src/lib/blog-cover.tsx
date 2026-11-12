import React from "react";
import { ImageResponse } from "next/og";
import { colors } from "@/colors";
import { visualOrder, type TextDir } from "@/lib/rtl-visual";

export const COVER_WIDTH = 1200;
export const COVER_HEIGHT = 630;

const ink = colors.ink;
const grape = colors.grape;

export type BlogCoverInput = {
  dir: TextDir;
  /** Logical-order title lines. Hebrew is reordered per line for Satori. */
  lines: string[];
  font: ArrayBuffer;
  icon: string;
};

/**
 * Blog share card. Hebrew titles are right-aligned and in bidi visual order.
 * English titles stay centered and left-to-right. The badge stays in the
 * top-right corner in both languages; only the words inside it are reordered.
 */
export function blogCoverResponse({ dir, lines, font, icon }: BlogCoverInput): ImageResponse {
  const rtl = dir === "rtl";
  const badge = rtl ? visualOrder("בלוג Kidsit", "rtl") : "Kidsit blog";
  const family = "Fredoka";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: `linear-gradient(90deg, ${colors.paper} 0%, #E4F4F6 100%)`,
          fontFamily: family,
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 64,
            top: 56,
            width: 1072,
            height: 510,
            background: "#fff",
            border: `4px solid ${ink}`,
            borderRadius: 48,
            boxShadow: `10px 10px 0 0 ${ink}`,
          }}
        />
        <Sticker left={46} top={36} size={46} color={colors.sunny} />
        <Sticker left={104} top={22} size={28} color={colors.bubblegum} />
        <Sticker left={1136} top={568} size={30} color={colors.mint} />

        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 96,
            right: 108,
            background: grape,
            color: "#fff",
            border: `4px solid ${ink}`,
            borderRadius: 999,
            boxShadow: `6px 6px 0 0 ${ink}`,
            padding: "8px 22px 10px",
            fontSize: 28,
          }}
        >
          {badge}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            left: 120,
            top: 175,
            width: 960,
            height: 250,
            alignItems: rtl ? "flex-end" : "center",
            justifyContent: "center",
          }}
        >
          {lines.map((line) => (
            <div
              key={line}
              style={{
                display: "flex",
                fontSize: lines.length > 2 ? 48 : 54,
                lineHeight: 1.25,
                color: ink,
                textAlign: rtl ? "right" : "center",
              }}
            >
              {visualOrder(line, dir)}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            position: "absolute",
            left: 120,
            top: 468,
            gap: 16,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon} width={72} height={72} alt="" style={{ borderRadius: 16 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 32, color: ink }}>Kidsit AI</div>
            <div style={{ display: "flex", fontSize: 22, color: grape }}>kidsit.ai</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            position: "absolute",
            right: 128,
            top: 488,
            gap: 14,
          }}
        >
          <Dash color={colors.bubblegum} />
          <Dash color={colors.sunny} />
          <Dash color={colors.mint} />
        </div>
      </div>
    ),
    {
      width: COVER_WIDTH,
      height: COVER_HEIGHT,
      fonts: [{ name: family, data: font, weight: 600, style: "normal" }],
    },
  );
}

function Sticker({ left, top, size, color }: { left: number; top: number; size: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        borderRadius: size,
        background: color,
        border: `4px solid ${ink}`,
      }}
    />
  );
}

function Dash({ color }: { color: string }) {
  return (
    <div
      style={{
        display: "flex",
        width: 42,
        height: 12,
        borderRadius: 8,
        background: color,
        border: `3px solid ${ink}`,
      }}
    />
  );
}

export async function renderBlogCoverPng(input: BlogCoverInput): Promise<Buffer> {
  const response = blogCoverResponse(input);
  return Buffer.from(await response.arrayBuffer());
}
