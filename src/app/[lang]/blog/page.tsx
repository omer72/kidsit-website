import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogInstallBar } from "@/components/blog-install-bar";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ogFor } from "@/lib/seo";
import { listPosts } from "@/lib/blog";
import { dictionaries, type Lang } from "@/dictionaries";

export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "he" }];
}

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  if (params.lang !== "he") return {};
  const title = "בלוג | Kidsit AI";
  const description = "מאמרים להורים: התקפי זעם, מלחמות שינה, ריבים בין אחים ועוד — הדרכה רגועה לרגעים הקשים.";
  return {
    title,
    description,
    ...ogFor("he", title, description, "/blog"),
    alternates: { canonical: "/he/blog" },
  };
}

export default function BlogIndex({ params }: { params: { lang: Lang } }) {
  if (params.lang !== "he") notFound();
  const d = dictionaries.he;
  const posts = listPosts();
  return (
    <>
      <Navbar t={d.nav} base="/he" />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-semibold">בלוג</h1>
        <p className="mt-4 font-bold text-ink/80">מאמרים קצרים להורים על הרגעים הקשים של היום.</p>
        <ul className="blog-index-list mt-10 space-y-6">
          {posts.map((p) => (
            <li key={p.slug} className="rounded-2xl border-2 border-ink bg-white p-5 shadow-sticker-sm">
              <p className="text-sm font-bold text-ink-muted">
                <time dateTime={p.date}>{p.date.split("-").reverse().join(".")}</time>
              </p>
              <Link href={p.path} className="mt-1 block font-display text-2xl font-semibold text-grape hover:underline">
                {p.title}
              </Link>
              <p className="mt-2 font-bold text-ink/80">{p.description}</p>
            </li>
          ))}
        </ul>
      </main>
      <Footer t={d.footer} base="/he" path="/blog" lang="he" />
      <BlogInstallBar />
    </>
  );
}
