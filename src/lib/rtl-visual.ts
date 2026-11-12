import bidiFactory from "bidi-js";

const bidi = bidiFactory();

export type TextDir = "ltr" | "rtl";

/**
 * Satori paints glyphs in memory order, left to right, and does not run the
 * Unicode Bidirectional Algorithm. Hebrew drawn that way is backwards, and a
 * whole-string reverse also flips Latin words ("Kidsit"), numbers, and the
 * side punctuation sits on.
 *
 * This returns the string in visual order for an LTR shaper. LTR text is
 * returned unchanged. Each line is reordered on its own so a wrapped title
 * keeps its line breaks.
 */
export function visualOrder(text: string, dir: TextDir): string {
  if (dir === "ltr" || text.length === 0) return text;
  return text
    .split("\n")
    .map((line) => {
      if (line.length === 0) return line;
      const levels = bidi.getEmbeddingLevels(line, "rtl");
      return bidi.getReorderedString(line, levels);
    })
    .join("\n");
}
