import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogInstallBar } from "@/components/blog-install-bar";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ogFor, postShareImage } from "@/lib/seo";
import { allSlugs, blogAlternate, formatPostDate, getPost, postLanguageAlternates } from "@/lib/blog";
import { dictionaries, LANGS, type Lang } from "@/dictionaries";

const COPY = {
  he: {
    back: "→ חזרה לבלוג",
    byline: "נכתב על ידי צוות Kidsit",
    updated: "עודכן:",
    reviewed: (name: string, credential: string) => `נבדק מקצועית על ידי ${name}, ${credential}`,
    sources: "מקורות",
    newTab: " (נפתח בכרטיסייה חדשה)",
  },
  en: {
    back: "← Back to the blog",
    byline: "Kidsit Team",
    updated: "Updated:",
    reviewed: (name: string, credential: string) => `Reviewed by ${name}, ${credential}`,
    sources: "Sources",
    newTab: " (opens in a new tab)",
  },
} as const;

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.flatMap((lang) => allSlugs(lang).map((slug) => ({ lang, slug })));
}

export function generateMetadata({ params }: { params: { lang: Lang; slug: string } }): Metadata {
  if (!LANGS.includes(params.lang)) return {};
  const post = getPost(params.slug, params.lang);
  if (!post) return {};
  const image = postShareImage(params.lang, post.slug, post.title);
  return {
    title: post.titleTag,
    description: post.description,
    ...ogFor(params.lang, post.titleTag, post.description, `/blog/${post.slug}`, "article", image),
    alternates: postLanguageAlternates(params.lang, post.slug, post.path),
  };
}

export default function BlogPost({ params }: { params: { lang: Lang; slug: string } }) {
  if (!LANGS.includes(params.lang)) notFound();
  const post = getPost(params.slug, params.lang);
  if (!post) notFound();
  const lang = params.lang;
  const d = dictionaries[lang];
  const ui = COPY[lang];
  const shareImage = postShareImage(lang, post.slug, post.title);
  const alternate = blogAlternate(lang, post.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.dateModified,
    inLanguage: lang,
    author: { "@type": "Organization", name: "Kidsit AI", url: "https://kidsit.ai" },
    ...(post.reviewer
      ? { reviewedBy: { "@type": "Person", name: post.reviewer.name, jobTitle: post.reviewer.credential } }
      : {}),
    publisher: { "@type": "Organization", name: "Kidsit AI", url: "https://kidsit.ai", logo: { "@type": "ImageObject", url: "https://kidsit.ai/icon-512.png" } },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://kidsit.ai${post.path}` },
    image: shareImage.url,
  };
  const faqLd =
    post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: lang,
          mainEntityOfPage: { "@type": "WebPage", "@id": `https://kidsit.ai${post.path}` },
          mainEntity: post.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null;
  return (
    <>
      <Navbar t={d.nav} base={`/${lang}`} />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <Link href={`/${lang}/blog`} className="inline-flex min-h-11 items-center font-bold text-grape hover:underline">
          {ui.back}
        </Link>
        <article className="text-start">
          <p className="mt-6 text-sm font-bold text-ink-muted">{ui.byline}</p>
          <p className="mt-1 text-sm font-bold text-ink-muted">
            {ui.updated} <time dateTime={post.dateModified}>{formatPostDate(post.dateModified, lang)}</time>
          </p>
          {post.reviewer ? (
            <p className="mt-1 text-sm font-bold text-ink-muted">{ui.reviewed(post.reviewer.name, post.reviewer.credential)}</p>
          ) : null}
          <h1 className="mt-2 font-display text-4xl font-semibold">{post.title}</h1>
          <div className="blog-prose mt-8 font-bold text-ink/85" dangerouslySetInnerHTML={{ __html: post.html }} />
          {post.sources.length > 0 ? (
            <section className="blog-sources blog-prose mt-12 border-t-2 border-ink pt-8" aria-labelledby="post-sources-heading">
              <h2 id="post-sources-heading">{ui.sources}</h2>
              <ul>
                {post.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener">
                      {source.title}
                      <span className="sr-only">{ui.newTab}</span>
                    </a>
                    {source.publisher ? <span> — {source.publisher}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} /> : null}
      <Footer
        t={d.footer}
        base={`/${lang}`}
        path={`/blog/${post.slug}`}
        lang={lang}
        switchTo={alternate?.path}
      />
      <BlogInstallBar lang={lang} />
    </>
  );
}
