import { MotionRoot } from "@/components/motion";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Summary } from "@/components/summary";
import { Showcase } from "@/components/showcase";
import { SocialProof } from "@/components/social-proof";
import { Pricing } from "@/components/pricing";
import { Faq } from "@/components/faq";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";
import { APP_STORE_URL, dictionaries, PLAY_STORE_URL, type Lang } from "@/dictionaries";
import { HOME_PAGE, smartBannerContent } from "@/lib/store-links";

// Only /he and /en exist (params come from the [lang] layout); anything else is a 404, never a render with an unknown lang.
export const dynamicParams = false;

// Per-page iOS Smart App Banner (the layout sets the generic one): app-argument = this page, ct = <lang>-home-banner.
export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  return {
    other: {
      "apple-itunes-app": smartBannerContent(
        { medium: "home", lang: params.lang, page: HOME_PAGE, placement: "banner" },
        `https://kidsit.ai/${params.lang}`,
      ),
    },
  };
}

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
        operatingSystem: "Android, iOS",
        applicationCategory: "LifestyleApplication",
        inLanguage: params.lang,
        featureList: [...t.features.cards.map((c) => c.title), t.summary.schemaFeature],
        downloadUrl: [APP_STORE_URL, PLAY_STORE_URL],
        // Offers match the prices the page shows: Hebrew shows the Google Play Israel prices in ILS, English the US prices.
        offers:
          params.lang === "he"
            ? [
                { "@type": "Offer", price: "0", priceCurrency: "ILS", name: "Free" },
                { "@type": "Offer", price: "175", priceCurrency: "ILS", name: "Premium yearly (Google Play, Israel)" },
                { "@type": "Offer", price: "29.90", priceCurrency: "ILS", name: "Premium monthly (Google Play, Israel)" },
              ]
            : [
                { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
                { "@type": "Offer", price: "59.99", priceCurrency: "USD", name: "Premium yearly" },
                { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "Premium monthly" },
              ],
        sameAs: [APP_STORE_URL, PLAY_STORE_URL],
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
        <Summary t={t.summary} lang={params.lang} />
        <Showcase t={t.showcase} lang={params.lang} />
        <SocialProof t={t.social} />
        <Pricing t={t.pricing} lang={params.lang} />
        <Faq t={t.faq} />
      </main>
      <Footer t={t.footer} base={`/${params.lang}`} lang={params.lang} />
    </MotionRoot>
  );
}
