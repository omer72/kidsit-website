import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogInstallBar } from "@/components/blog-install-bar";
import { BLOG_INDEX_PAGE } from "@/lib/store-links";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ogFor } from "@/lib/seo";
import { blogIndexAlternates, formatPostDate, listPosts } from "@/lib/blog";
import { dictionaries, LANGS, type Lang } from "@/dictionaries";

const COPY = {
  he: {
    title: "בלוג | Kidsit AI",
    description: "מאמרים להורים: התקפי זעם, מלחמות שינה, ריבים בין אחים ועוד: הדרכה רגועה לרגעים הקשים.",
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
      <main className="mx-auto max-w-5xl px-5 py-16 sm:px-6">
        <h1 className="min-w-0 text-balance break-words font-display text-4xl font-semibold sm:text-5xl">{copy.h1}</h1>
        <p className="mt-4 max-w-xl text-lg font-bold text-ink/80">{copy.intro}</p>
        {/* The newest post leads across both columns; each post shows its own share card. */}
        <ul className="blog-index-list mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2">
          {posts.map((p, i) => {
            const lead = i === 0;
            return (
              <li
                key={p.slug}
                className={lead ? "grid gap-6 md:col-span-2 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center md:gap-10" : ""}
              >
                {/* The share card carries its own sticker frame. The title link is the one tab stop; the picture repeats it for pointer users. */}
                <Link href={p.path} tabIndex={-1} aria-hidden="true" className="block">
                  <Image
                    src={`/og/${lang}/${p.slug}.png`}
                    alt=""
                    width={1200}
                    height={630}
                    priority={lead}
                    sizes={lead ? "(max-width: 768px) 100vw, 580px" : "(max-width: 768px) 100vw, 470px"}
                    className="h-auto w-full"
                  />
                </Link>
                <div className={lead ? "" : "mt-5"}>
                  <p className="text-sm font-bold text-ink-muted">
                    <time dateTime={p.date}>
                      {lang === "he" ? p.date.split("-").reverse().join(".") : formatPostDate(p.date, "en")}
                    </time>
                  </p>
                  <h2 className="mt-1 min-w-0 text-balance break-words">
                    <Link
                      href={p.path}
                      className={`blog-index-title block font-display font-semibold hover:text-grape hover:underline active:text-grape ${
                        lead ? "text-2xl sm:text-4xl" : "text-2xl"
                      }`}
                    >
                      {p.title}
                    </Link>
                  </h2>
                  <p className="mt-2 max-w-[65ch] font-bold text-ink/80">{p.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
      <Footer t={d.footer} base={`/${lang}`} path="/blog" lang={lang} switchTo={`/${other}/blog`} />
      <BlogInstallBar lang={lang} page={BLOG_INDEX_PAGE} />
    </>
  );
}
