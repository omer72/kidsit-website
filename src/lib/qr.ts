import qrcode from "qrcode-generator";

/** One QR code as an inline SVG string (black on white, quiet zone included, scales to its box). Server-side only. */
export function qrSvg(text: string, label: string): string {
  const qr = qrcode(0, "M"); // type 0 = smallest version that fits, error correction M
  qr.addData(text);
  qr.make();
  const svg = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
  const safe = label.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return svg.replace("<svg", `<svg role="img" aria-label="${safe}" focusable="false" shape-rendering="crispEdges"`);
}

/** The URL the QR encodes: the smart store link (src/app/app/route.ts) for one language and page. */
export function qrTarget(lang: "he" | "en", page: string): string {
  const q = new URLSearchParams({ l: lang, p: page });
  return `https://kidsit.ai/app?${q.toString()}`;
}
