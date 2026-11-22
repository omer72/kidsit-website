import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndexList, type IndexPost } from "@/components/blog-index-list";
import { BlogInstallBar } from "@/components/blog-install-bar";
import { BLOG_INDEX_PAGE, smartBannerContent } from "@/lib/store-links";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ogFor } from "@/lib/seo";
import { blogIndexAlternates, formatPostDate, listPosts, TOPICS } from "@/lib/blog";
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
    other: {
      "apple-itunes-app": smartBannerContent(
        { medium: "blog", lang: params.lang, page: BLOG_INDEX_PAGE, placement: "banner" },
        `https://kidsit.ai/${params.lang}/blog`,
      ),
    },
  };
}

export default function BlogIndex({ params }: { params: { lang: Lang } }) {
  if (!LANGS.includes(params.lang)) notFound();
  const lang = params.lang;
  const d = dictionaries[lang];
  const copy = COPY[lang];
  const posts: IndexPost[] = listPosts(lang).map((p) => ({
    ...p,
    displayDate: lang === "he" ? p.date.split("-").reverse().join(".") : formatPostDate(p.date, "en"),
  }));
  const other: Lang = lang === "he" ? "en" : "he";
  return (
    <>
      <Navbar t={d.nav} base={`/${lang}`} />
      <main className="mx-auto max-w-5xl px-5 py-16 sm:px-6">
        <h1 className="min-w-0 text-balance break-words font-display text-4xl font-semibold sm:text-5xl">{copy.h1}</h1>
        <p className="mt-4 max-w-xl text-lg font-bold text-ink/80">{copy.intro}</p>
        {/* The newest post leads across both columns; each post shows its own share card. */}
        <BlogIndexList lang={lang} posts={posts} topics={TOPICS} />
      </main>
      <Footer t={d.footer} base={`/${lang}`} path="/blog" lang={lang} switchTo={`/${other}/blog`} />
      <BlogInstallBar lang={lang} page={BLOG_INDEX_PAGE} />
    </>
  );
}
