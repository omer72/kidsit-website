import Link from "next/link";
import { Footer } from "./footer";
import { dictionaries, type Lang } from "@/dictionaries";

export type Section = { id: string; h: string; p: React.ReactNode };

const NOTICE = "המסמך זמין כרגע באנגלית בלבד. גרסה בעברית בקרוב.";

// Legal text is English-only for now: the body is marked lang=en/ltr even on /he,
// with a Hebrew notice on top, so screen readers pick the right voice.
export function LegalPage({
  lang,
  title,
  updated,
  intro,
  sections,
}: {
  lang: Lang;
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
}) {
  const d = dictionaries[lang];
  const he = lang === "he";
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <Link href={d.legal.home} className="inline-flex min-h-11 items-center font-bold text-grape hover:underline">
          {he ? "→ " : "← "}
          {d.legal.back}
          <bdi>kidsit·ai</bdi>
        </Link>
        {he && (
          <p lang="he" dir="rtl" className="mt-4 rounded-xl border-2 border-ink bg-sunny/30 p-4 font-bold">
            {NOTICE}
          </p>
        )}
        <article lang="en" dir="ltr" className="text-left">
          <h1 className="mt-6 font-display text-4xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm font-bold text-ink-muted">Last updated: {updated}</p>
          <p className="mt-6 font-bold text-ink/80">{intro}</p>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="mt-8 scroll-mt-6">
              <h2 className="font-display text-2xl font-semibold">{s.h}</h2>
              <p className="mt-2 font-bold text-ink/80">{s.p}</p>
            </section>
          ))}
        </article>
      </main>
      <Footer t={d.footer} base={`/${lang}`} />
    </>
  );
}

export const CONTACT = "omer+support@kidsit.ai";
export const mail = (
  <a className="text-grape underline underline-offset-2" href={`mailto:${CONTACT}`}>
    {CONTACT}
  </a>
);
