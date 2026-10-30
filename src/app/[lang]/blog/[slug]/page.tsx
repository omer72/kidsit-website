import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogInstallBar } from "@/components/blog-install-bar";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { hePostShareImage, ogFor } from "@/lib/seo";
import { allSlugs, formatHebrewDate, getPost } from "@/lib/blog";
import { dictionaries, type Lang } from "@/dictionaries";

export const dynamicParams = false;
export function generateStaticParams() {
  return allSlugs().map((slug) => ({ lang: "he", slug }));
}

export function generateMetadata({ params }: { params: { lang: Lang; slug: string } }): Metadata {
  if (params.lang !== "he") return {};
  const post = getPost(params.slug);
  if (!post) return {};
  const image = hePostShareImage(post.slug, post.title);
  return {
    title: post.titleTag,
    description: post.description,
    ...ogFor("he", post.titleTag, post.description, `/blog/${post.slug}`, "article", image),
    alternates: { canonical: post.path },
  };
}

export default function BlogPost({ params }: { params: { lang: Lang; slug: string } }) {
  if (params.lang !== "he") notFound();
  const post = getPost(params.slug);
  if (!post) notFound();
  const d = dictionaries.he;
  const shareImage = hePostShareImage(post.slug, post.title);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.dateModified,
    inLanguage: "he",
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
          inLanguage: "he",
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
      <Navbar t={d.nav} base="/he" />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <Link href="/he/blog" className="inline-flex min-h-11 items-center font-bold text-grape hover:underline">
          → חזרה לבלוג
        </Link>
        <article className="text-start">
          <p className="mt-6 text-sm font-bold text-ink-muted">נכתב על ידי צוות Kidsit</p>
          <p className="mt-1 text-sm font-bold text-ink-muted">
            עודכן: <time dateTime={post.dateModified}>{formatHebrewDate(post.dateModified)}</time>
          </p>
          {post.reviewer ? (
            <p className="mt-1 text-sm font-bold text-ink-muted">
              נבדק מקצועית על ידי {post.reviewer.name}, {post.reviewer.credential}
            </p>
          ) : null}
          <h1 className="mt-2 font-display text-4xl font-semibold">{post.title}</h1>
          <div
            className="blog-prose mt-8 font-bold text-ink/85"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
          {post.sources.length > 0 ? (
            <section className="blog-sources blog-prose mt-12 border-t-2 border-ink pt-8" aria-labelledby="post-sources-heading">
              <h2 id="post-sources-heading">מקורות</h2>
              <ul>
                {post.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener">
                      {source.title}
                      <span className="sr-only"> (נפתח בכרטיסייה חדשה)</span>
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
      <Footer t={d.footer} base="/he" path={`/blog/${post.slug}`} lang="he" />
      <BlogInstallBar />
    </>
  );
}
