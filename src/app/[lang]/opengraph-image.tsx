import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { Lang } from "@/dictionaries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Kidsit AI, your AI parenting copilot, with the app's home screen";

const TEXT = {
  en: { tagline: "Your AI parenting copilot", family: "Fredoka", dir: "ltr" },
  he: { tagline: "קופיילוט ההורות שלכם", family: "Rubik", dir: "rtl" },
} as const;

// Satori needs ttf/otf: Google Fonts serves ttf to a UA-less request. Subset by text.
async function font(family: string, text: string) {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@600&text=${encodeURIComponent(text)}`,
    )
  ).text();
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error(`font ${family} not found`);
  return (await fetch(url)).arrayBuffer();
}

// Read from disk so the card never depends on the live site having these files yet.
const png = async (f: string) =>
  `data:image/png;base64,${(await readFile(join(process.cwd(), "public", f))).toString("base64")}`;

export default async function Image({ params }: { params: { lang: Lang } }) {
  const t = TEXT[params.lang] ?? TEXT.en;
  const text = `Kidsit AI${t.tagline}`;
  const [icon, shot] = await Promise.all([png("icon-512.png"), png("app-mic.png")]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: t.dir === "rtl" ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 64,
          background: "#F3F6FF",
          color: "#26265E",
          fontFamily: t.family,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon}
            width={200}
            height={200}
            alt=""
            style={{ borderRadius: 44 }}
          />
          <div style={{ fontSize: 84 }}>Kidsit AI</div>
          <div style={{ fontSize: 40, color: "#5B3DF5", direction: t.dir }}>{t.tagline}</div>
        </div>
        <div
          style={{
            display: "flex",
            border: "6px solid #26265E",
            borderRadius: 48,
            overflow: "hidden",
            boxShadow: "12px 12px 0 0 #26265E",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot} width={252} height={546} alt="" />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: t.family, data: await font(t.family, text), weight: 600, style: "normal" }],
    },
  );
}
