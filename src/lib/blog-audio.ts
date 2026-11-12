import manifestJson from "../../content/blog/audio-manifest.json";
import type { Lang } from "@/dictionaries";

/** One generated post, written by scripts/generate-blog-audio.mjs into content/blog/audio-manifest.json. */
export type BlogAudioEntry = {
  src: string; // site path (/audio/blog/he/x.mp3) or an absolute URL
  duration: number; // seconds
  bytes: number;
  hash: string;
  provider: string;
  model: string;
  voice: string;
  generatedAt: string;
};

const manifest = manifestJson as Record<string, BlogAudioEntry>;

export function blogAudioFor(lang: Lang, slug: string): BlogAudioEntry | null {
  return manifest[`${lang}/${slug}`] ?? null;
}

/** "האזינו למאמר · 6 דקות" / "Listen to this post · 6 min". Rounded to whole minutes, at least 1. */
export function listenLabel(lang: Lang, seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (lang === "he") return `האזינו למאמר · ${minutes === 1 ? "דקה אחת" : `${minutes} דקות`}`;
  return `Listen to this post · ${minutes} min`;
}

/** ISO 8601 duration for schema.org, e.g. 372 → "PT6M12S". */
export function isoDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s || (!h && !m) ? `${s}S` : ""}`;
}

export function absoluteAudioUrl(src: string): string {
  return /^https?:\/\//.test(src) ? src : `https://kidsit.ai${src}`;
}
