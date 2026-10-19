import Link from "next/link";
import { Footer } from "./footer";
import { dictionaries, SUPPORT_EMAIL, type Lang } from "@/dictionaries";

export type Section = { id: string; h: string; p: React.ReactNode };
export type LegalDoc = { title: string; updated: string; intro: React.ReactNode; sections: Section[] };

const UPDATED_LABEL: Record<Lang, string> = { en: "Last updated:", he: "עודכן לאחרונה:" };

// Shared shell for the privacy, terms and support pages. The document is written in the page
// language, so it inherits lang/dir from <html> (rtl on /he).
export function LegalPage({ lang, path, doc, children }: { lang: Lang; path: string; doc: LegalDoc; children?: React.ReactNode }) {
  const d = dictionaries[lang];
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <Link href={d.legal.home} className="inline-flex min-h-11 items-center font-bold text-grape hover:underline">
          {d.legal.back}
          <bdi dir="ltr">kidsit·ai</bdi>
        </Link>
        <article className="text-start">
          <h1 className="mt-6 font-display text-4xl font-semibold">{doc.title}</h1>
          <p className="mt-2 text-sm font-bold text-ink-muted">
            {UPDATED_LABEL[lang]} {doc.updated}
          </p>
          <p className="mt-6 font-bold text-ink/80">{doc.intro}</p>
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="mt-8 scroll-mt-6">
              <h2 className="font-display text-2xl font-semibold">{s.h}</h2>
              <div className="mt-2 font-bold text-ink/80">{s.p}</div>
            </section>
          ))}
          {children}
        </article>
      </main>
      <Footer t={d.footer} base={`/${lang}`} path={path} />
    </>
  );
}

export const CONTACT = SUPPORT_EMAIL;
// dir=ltr + bdi keeps the address readable (and the trailing period outside it) inside Hebrew text.
export const mail = (
  <bdi>
    <a className="text-grape underline underline-offset-2" href={`mailto:${CONTACT}`} dir="ltr">
      {CONTACT}
    </a>
  </bdi>
);
