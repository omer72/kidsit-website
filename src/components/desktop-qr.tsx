import { qrSvg, qrTarget } from "@/lib/qr";
import type { Lang } from "@/dictionaries";

const COPY = {
  he: { label: "קוד QR להורדת Kidsit בטלפון", caption: "במחשב? סרקו עם הטלפון" },
  en: { label: "QR code to get Kidsit on your phone", caption: "On a computer? Scan with your phone" },
} as const;

/**
 * QR code to the app for desktop visitors only. The code is generated on the server (no client JS) and the
 * `desktop-only` class (globals.css) shows it only on wide screens with a mouse: it stays hidden on phones and tablets,
 * where the store badges are one tap away. It encodes the smart store link /app (iPhone → App Store, Android → Google Play)
 * with the page token, so scans are attributed with placement "qr".
 */
export function DesktopQr({ lang, page, className = "" }: { lang: Lang; page: string; className?: string }) {
  const t = COPY[lang];
  const svg = qrSvg(qrTarget(lang, page), t.label);
  return (
    <figure className={`desktop-only shrink-0 text-center ${className}`}>
      <div className="mx-auto h-28 w-28 overflow-hidden rounded-lg border-2 border-ink bg-white" dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption className="mt-1.5 max-w-[9rem] text-xs font-bold text-ink-muted">{t.caption}</figcaption>
    </figure>
  );
}
