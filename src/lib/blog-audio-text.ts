import { createHash } from "node:crypto";
import type { Lang } from "@/dictionaries";

/**
 * Markdown → spoken text for the blog audio, used by scripts/generate-blog-audio.mjs.
 * Node only (hashing). The page side lives in blog-audio.ts.
 */

export type LexiconEntry = { from: string; to: string; regex?: boolean };

export type VoiceConfig = {
  provider: "elevenlabs" | "google";
  model: string;
  voice: string;
  languageCode?: string;
  settings?: Record<string, unknown>;
  limit: { unit: "chars" | "bytes"; max: number };
};

const INTRO: Record<Lang, (title: string) => string> = {
  he: (title) => `מהבלוג של Kidsit. ${sentence(title)}`,
  en: (title) => `From the Kidsit blog. ${sentence(title)}`,
};

/** Paragraphs with a store link are the "download Kidsit" call to action (top or bottom of a post). */
const STORE_LINK = /apps\.apple\.com|play\.google\.com\/store/;

/** Ends the text with a full stop unless it already ends a sentence, so the voice pauses. */
function sentence(text: string): string {
  return /[.!?…:;»"”״)]$/.test(text) ? text : `${text}.`;
}

/** Inline markdown → plain words: link text only, no images, URLs, HTML or emphasis marks. */
function inline(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<https?:[^>]*>/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[*`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tableRows(block: string): string[] {
  return block
    .split("\n")
    .filter((line) => !/^\s*\|?\s*:?-{2,}/.test(line))
    .map((line) =>
      line
        .replace(/^\s*\||\|\s*$/g, "")
        .split("|")
        .map((cell) => inline(cell))
        .filter(Boolean)
        .join(", "),
    )
    .filter(Boolean)
    .map(sentence);
}

function spokenBlock(p: string): string {
  if (/^#{2,6}\s/.test(p)) return sentence(inline(p.replace(/^#+\s*/, "")));
  if (p.split("\n").every((line) => line.trim().startsWith("|"))) return tableRows(p).join("\n");
  const lines = p
    .split("\n")
    .map((line) => line.replace(/^\s*>\s?/, ""))
    .filter((line) => !/^\s*<\/?[a-z][^>]*>\s*$/i.test(line));
  const listy = lines.some((line) => /^\s*([-*+]|\d+\.)\s+/.test(line));
  return listy
    ? lines
        .map((line) => inline(line.replace(/^\s*([-*+]|\d+\.)\s+/, "")))
        .filter(Boolean)
        .map(sentence)
        .join("\n")
    : inline(lines.join(" "));
}

/**
 * The words to speak for one post: "From the Kidsit blog. <title>." then the body without front
 * matter, the FAQ JSON, images, HTML or link targets (link text stays). A `##` section with a plain
 * store-link paragraph is the "download Kidsit" call to action and is dropped whole; a promo
 * blockquote with store links, and any store paragraph before the first `##`, is dropped alone. A `---` rule starts a new section, so the closing disclaimer is still read.
 * Headings become their own sentence and are dropped when nothing under them is spoken (the FAQ).
 */
export function speechFromMarkdown(raw: string, lang: Lang): { title: string; text: string } {
  const body = raw
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/```[\s\S]*?```/g, "");
  let title = "";
  const sections: { heading: string | null; blocks: string[] }[] = [{ heading: null, blocks: [] }];
  for (const block of body.split(/\n\s*\n/)) {
    const p = block.trim();
    if (!p || /^(<\/?[a-z][^>]*>\s*)+$/i.test(p)) continue;
    if (/^#\s/.test(p)) title ||= inline(p.replace(/^#\s+/, ""));
    else if (/^##\s/.test(p)) sections.push({ heading: p, blocks: [] });
    else if (/^([-*_]\s*){3,}$/.test(p)) sections.push({ heading: null, blocks: [] });
    else sections[sections.length - 1].blocks.push(p);
  }
  const out: string[] = [];
  sections.forEach((section, i) => {
    // A promo blockquote with store links sits inside content; a plain store paragraph is the closing CTA.
    const isCta = section.heading !== null && section.blocks.some((p) => STORE_LINK.test(p) && !p.startsWith(">"));
    if (isCta || (i > 0 && section.heading === null && section.blocks.length === 0)) return;
    const spoken = section.blocks.filter((p) => !STORE_LINK.test(p)).map(spokenBlock).filter(Boolean);
    if (!spoken.length) return;
    if (section.heading) out.push(spokenBlock(section.heading));
    out.push(...spoken);
  });
  return { title, text: [INTRO[lang](title), ...out].join("\n\n") };
}

/** Written → spoken replacements, in file order. `regex: true` entries are global regular expressions. */
export function applyLexicon(text: string, lexicon: LexiconEntry[]): string {
  return lexicon.reduce(
    (acc, entry) => (entry.regex ? acc.replace(new RegExp(entry.from, "gu"), entry.to) : acc.split(entry.from).join(entry.to)),
    text,
  );
}

export function measure(text: string, unit: "chars" | "bytes"): number {
  return unit === "bytes" ? Buffer.byteLength(text, "utf8") : text.length;
}

/** Greedy packing of pieces joined by `sep`, each chunk at most `max`. */
function pack(pieces: string[], sep: string, max: number, size: (s: string) => number): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    const candidate = current ? `${current}${sep}${piece}` : piece;
    if (size(candidate) <= max) current = candidate;
    else {
      if (current) chunks.push(current);
      current = piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Splits only at paragraph boundaries; a paragraph over the limit falls back to sentences, then words. */
export function chunkText(text: string, max: number, unit: "chars" | "bytes" = "chars"): string[] {
  const size = (s: string) => measure(s, unit);
  const words = (s: string) => pack(s.split(/\s+/), " ", max, size);
  const sentences = (p: string) =>
    pack(p.split(/(?<=[.!?…])\s+/), " ", max, size).flatMap((s) => (size(s) > max ? words(s) : [s]));
  const pieces = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((p) => (size(p) > max ? sentences(p) : [p]));
  return pack(pieces, "\n\n", max, size);
}

/** Changes when the spoken text (after the lexicon), provider, model, voice, settings or output format change. */
export function audioHash(text: string, voice: VoiceConfig, output: Record<string, unknown>): string {
  const key = JSON.stringify({
    provider: voice.provider,
    model: voice.model,
    voice: voice.voice,
    languageCode: voice.languageCode ?? null,
    settings: voice.settings ?? {},
    output,
    text,
  });
  return createHash("sha256").update(key).digest("hex").slice(0, 32);
}

/** A post is regenerated when forced, when its file is missing, or when the hash in the manifest differs. */
export function needsAudio(entry: { hash?: string } | undefined, hash: string, fileExists: boolean, forced = false): boolean {
  return forced || !fileExists || entry?.hash !== hash;
}
