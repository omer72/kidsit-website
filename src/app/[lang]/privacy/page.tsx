import type { Metadata } from "next";
import Link from "next/link";
import { dictionaries, type Lang } from "@/dictionaries";

export const metadata: Metadata = {
  title: "Privacy Policy — Kidsit AI",
};

const SECTIONS = [
  {
    h: "Information We Collect",
    p: "The App collects information you provide directly: children's names, ages, characteristics, and situation descriptions. This information is stored locally on your device only.",
  },
  {
    h: "How We Use Information",
    p: "Information is used solely to provide personalized parenting guidance. Situation descriptions are sent to external AI services (OpenAI/Anthropic) for processing but are not stored by us.",
  },
  {
    h: "Data Storage",
    p: "All personal information is stored locally on your device (Local Storage). We do not store personal information on our servers.",
  },
  {
    h: "Third-Party Sharing",
    p: "Situation descriptions are sent to AI providers (OpenAI, Anthropic) for generating recommendations. These providers are subject to their own privacy policies. We do not sell or share personal information with any other third parties.",
  },
  {
    h: "Your Rights",
    p: "Under the Israeli Privacy Protection Law and GDPR, you have the right to access, correct, or delete your data. Since data is stored locally, you can delete it at any time through your browser settings.",
  },
  {
    h: "Data Security",
    p: "We implement security measures including HTTPS, security headers, and strict content policies to protect your information.",
  },
  {
    h: "Contact Us",
    p: "For privacy-related questions, you can reach us through the website.",
  },
];

export default function Privacy({ params }: { params: { lang: Lang } }) {
  const t = dictionaries[params.lang].legal;
  return (
    <main dir="ltr" className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
      <Link href={t.home} className="font-bold text-grape hover:underline">
        {t.back}
      </Link>
      <h1 className="mt-6 font-display text-4xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm font-bold text-ink/60">Last updated: March 2026</p>
      <p className="mt-6 font-bold text-ink/80">
        Kidsit.ai (&quot;the App&quot;) is committed to protecting your privacy and the
        privacy of your children. This policy explains how we collect, use, and
        protect your information.
      </p>
      {SECTIONS.map((s) => (
        <section key={s.h} className="mt-8">
          <h2 className="font-display text-2xl font-semibold">{s.h}</h2>
          <p className="mt-2 font-bold text-ink/80">{s.p}</p>
        </section>
      ))}
    </main>
  );
}
