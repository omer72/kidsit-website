import { fontClass } from "../../[lang]/fonts-he";
import type { Lang } from "@/lib/admin/lang";

// Root <html> for the private admin area (shared by the Hebrew and English route groups): no analytics, no consent banner,
// no Nagish. Hebrew is RTL; English is LTR with lang="en". Rubik covers both scripts.
export function AdminRoot({ lang, children }: Readonly<{ lang: Lang; children: React.ReactNode }>) {
  return (
    <html lang={lang} dir={lang === "en" ? "ltr" : "rtl"}>
      <body
        className={`${fontClass} bg-paper font-body text-ink antialiased`}
        style={{ "--font-body": "var(--font-rubik)" } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
