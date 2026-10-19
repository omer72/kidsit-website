"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

// not-found doesn't receive params as props: read the [lang] segment (also set when the middleware rewrote a bare
// unknown path like /xyz to /he/xyz), falling back to the URL.
const TEXT = {
  en: { title: "Page not found", body: "We couldn't find this page. It may have moved or never existed.", home: "Back to the home page" },
  he: { title: "העמוד לא נמצא", body: "לא מצאנו את העמוד הזה. ייתכן שהוא הועבר או שאינו קיים.", home: "חזרה לעמוד הבית" },
};

export default function NotFound() {
  const seg = useParams<{ lang?: string }>()?.lang;
  const path = usePathname() ?? "";
  const lang = seg === "he" || seg === "en" ? seg : /^\/he(\/|$)/.test(path) ? "he" : "en";
  const t = TEXT[lang];
  return (
    <main className="mx-auto max-w-3xl px-5 py-24 text-start sm:px-6">
      <p className="font-display text-6xl font-semibold text-grape">404</p>
      <h1 className="mt-4 font-display text-4xl font-semibold">{t.title}</h1>
      <p className="mt-4 font-bold text-ink/80">{t.body}</p>
      <Link
        href={`/${lang}`}
        className="mt-8 inline-flex min-h-11 items-center rounded-xl border-2 border-ink bg-grape px-5 font-bold text-white shadow-sticker-sm"
      >
        {t.home}
      </Link>
    </main>
  );
}
