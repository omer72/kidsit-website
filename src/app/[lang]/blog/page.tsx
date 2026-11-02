import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogInstallBar } from "@/components/blog-install-bar";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ogFor } from "@/lib/seo";
import { blogIndexAlternates, formatPostDate, listPosts } from "@/lib/blog";
import { dictionaries, LANGS, type Lang } from "@/dictionaries";

const COPY = {
  he: {
    title: "בלוג | Kidsit AI",
    description: "מאמרים להורים: התקפי זעם, מלחמות שינה, ריבים בין אחים ועוד — הדרכה רגועה לרגעים הקשים.",
    h1: "בלוג",
    intro: "מאמרים קצרים להורים על הרגעים הקשים של היום.",
  },
  en: {
    title: "Blog | Kidsit AI",
    description: "Short guides for parents: screen-time meltdowns, tantrums, bedtime, and the other hard moments of the day.",
    h1: "Blog",
    intro: "Short guides for the hard moments of the day.",
  },
} as const;

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  if (!LANGS.includes(params.lang)) return {};
  const copy = COPY[params.lang];
  return {
    title: copy.title,
    description: copy.description,
    ...ogFor(params.lang, copy.title, copy.description, "/blog"),
    alternates: blogIndexAlternates(params.lang),
  };
}

export default function BlogIndex({ params }: { params: { lang: Lang } }) {
  if (!LANGS.includes(params.lang)) notFound();
  const lang = params.lang;
  const d = dictionaries[lang];
  const copy = COPY[lang];
  const posts = listPosts(lang);
  const other: Lang = lang === "he" ? "en" : "he";
  return (
    <>
      <Navbar t={d.nav} base={`/${lang}`} />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-semibold">{copy.h1}</h1>
        <p className="mt-4 font-bold text-ink/80">{copy.intro}</p>
        <ul className="blog-index-list mt-10 space-y-6">
          {posts.map((p) => (
            <li key={p.slug} className="rounded-2xl border-2 border-ink bg-white p-5 shadow-sticker-sm">
              <p className="text-sm font-bold text-ink-muted">
                <time dateTime={p.date}>
                  {lang === "he" ? p.date.split("-").reverse().join(".") : formatPostDate(p.date, "en")}
                </time>
              </p>
              <Link href={p.path} className="blog-index-title mt-1 block font-display text-2xl font-semibold text-grape hover:underline">
                {p.title}
              </Link>
              <p className="mt-2 font-bold text-ink/80">{p.description}</p>
            </li>
          ))}
        </ul>
      </main>
      <Footer t={d.footer} base={`/${lang}`} path="/blog" lang={lang} switchTo={`/${other}/blog`} />
      <BlogInstallBar lang={lang} />
    </>
  );
}
