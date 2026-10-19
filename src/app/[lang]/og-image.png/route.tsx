import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { LANGS, type Lang } from "@/dictionaries";

// Share card at /<lang>/og-image.png, referenced (with per-language alt text) by ogFor() in src/lib/seo.ts.
// A plain route handler instead of the opengraph-image file convention, because that convention only allows one
// alt text for every language. Prerendered at build time: on Vercel, files in /public are served by the CDN and
// are NOT bundled into the serverless function, so reading public/*.png at request time threw ENOENT
// (/var/task/public/icon-512.png) and every card request returned 500.
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

const size = { width: 1200, height: 630 };

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

// Satori has no bidi algorithm: it lays glyphs out left to right, so a Hebrew string comes out
// mirrored. The tagline is pure Hebrew letters and spaces, so reversing it gives the visual order.
const visual = (text: string, dir: string) => (dir === "rtl" ? Array.from(text).reverse().join("") : text);

// Read from disk at build time (the route is prerendered, see generateStaticParams above).
const png = async (f: string) =>
  `data:image/png;base64,${(await readFile(join(process.cwd(), "public", f))).toString("base64")}`;

export async function GET(_req: Request, { params }: { params: { lang: Lang } }) {
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
          <div style={{ fontSize: 40, color: "#5B3DF5" }}>{visual(t.tagline, t.dir)}</div>
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
      // the URL has no content hash, so keep browser/crawler caching to a day
      headers: { "cache-control": "public, max-age=86400" },
      fonts: [{ name: t.family, data: await font(t.family, text), weight: 600, style: "normal" }],
    },
  );
}
