import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogInstallBar } from "@/components/blog-install-bar";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ogFor } from "@/lib/seo";
import { allSlugs, getPost } from "@/lib/blog";
import { dictionaries, type Lang } from "@/dictionaries";

export const dynamicParams = false;
export function generateStaticParams() {
  return allSlugs().map((slug) => ({ lang: "he", slug }));
}

export function generateMetadata({ params }: { params: { lang: Lang; slug: string } }): Metadata {
  if (params.lang !== "he") return {};
  const post = getPost(params.slug);
  if (!post) return {};
  return {
    title: post.titleTag,
    description: post.description,
    ...ogFor("he", post.titleTag, post.description, `/blog/${post.slug}`, "article"),
    alternates: { canonical: post.path },
  };
}

export default function BlogPost({ params }: { params: { lang: Lang; slug: string } }) {
  if (params.lang !== "he") notFound();
  const post = getPost(params.slug);
  if (!post) notFound();
  const d = dictionaries.he;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "he",
    author: { "@type": "Organization", name: "Kidsit AI", url: "https://kidsit.ai" },
    publisher: { "@type": "Organization", name: "Kidsit AI", url: "https://kidsit.ai", logo: { "@type": "ImageObject", url: "https://kidsit.ai/icon-512.png" } },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://kidsit.ai${post.path}` },
    image: "https://kidsit.ai/he/og-image.png",
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
          <p className="mt-6 text-sm font-bold text-ink-muted">
            <time dateTime={post.date}>{post.date.split("-").reverse().join(".")}</time>
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{post.title}</h1>
          <div
            className="blog-prose mt-8 font-bold text-ink/85"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} /> : null}
      <Footer t={d.footer} base="/he" path={`/blog/${post.slug}`} lang="he" />
      <BlogInstallBar />
    </>
  );
}
