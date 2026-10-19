import { MotionRoot } from "@/components/motion";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Showcase } from "@/components/showcase";
import { SocialProof } from "@/components/social-proof";
import { Pricing } from "@/components/pricing";
import { Faq } from "@/components/faq";
import { Footer } from "@/components/footer";
import { dictionaries, storeUrl, type Lang } from "@/dictionaries";

// Only /he and /en exist (params come from the [lang] layout); anything else is a 404, never a render with an unknown lang.
export const dynamicParams = false;

export default function Home({ params }: { params: { lang: Lang } }) {
  const t = dictionaries[params.lang];
  // No aggregateRating until the store has a meaningful number of ratings.
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "Kidsit AI", url: "https://kidsit.ai", logo: "https://kidsit.ai/icon-512.png" },
      {
        "@type": "MobileApplication",
        name: "Kidsit AI",
        operatingSystem: "iOS, Android",
        applicationCategory: "LifestyleApplication",
        inLanguage: params.lang,
        offers: [
          { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
          { "@type": "Offer", price: "59.99", priceCurrency: "USD", name: "Premium yearly" },
          { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "Premium monthly" },
        ],
        sameAs: [storeUrl.apple("site_schema", params.lang), storeUrl.play("site_schema", params.lang)],
      },
      {
        "@type": "FAQPage",
        mainEntity: t.faq.items.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return (
    <MotionRoot>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Navbar t={t.nav} />
      <main>
        <Hero t={t.hero} lang={params.lang} />
        <Features t={t.features} />
        <Showcase t={t.showcase} lang={params.lang} />
        <SocialProof t={t.social} />
        <Pricing t={t.pricing} lang={params.lang} />
        <Faq t={t.faq} />
      </main>
      <Footer t={t.footer} base={`/${params.lang}`} lang={params.lang} />
    </MotionRoot>
  );
}
