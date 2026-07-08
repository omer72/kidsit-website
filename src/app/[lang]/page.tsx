import { MotionRoot } from "@/components/motion";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Showcase } from "@/components/showcase";
import { SocialProof } from "@/components/social-proof";
import { Pricing } from "@/components/pricing";
import { Faq } from "@/components/faq";
import { Footer } from "@/components/footer";
import { dictionaries, type Lang } from "@/dictionaries";

export default function Home({ params }: { params: { lang: Lang } }) {
  const t = dictionaries[params.lang];
  return (
    <MotionRoot>
      <Navbar t={t.nav} />
      <main>
        <Hero t={t.hero} />
        <Features t={t.features} />
        <Showcase t={t.showcase} />
        <SocialProof t={t.social} />
        <Pricing t={t.pricing} />
        <Faq t={t.faq} />
      </main>
      <Footer t={t.footer} />
    </MotionRoot>
  );
}
