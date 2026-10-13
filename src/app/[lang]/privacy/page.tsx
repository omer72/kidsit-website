import type { Metadata } from "next";
import { LegalPage, mail, type Section } from "@/components/legal";
import type { Lang } from "@/dictionaries";

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  const he = params.lang === "he";
  const title = he ? "מדיניות פרטיות | Kidsit AI" : "Privacy Policy | Kidsit AI";
  const description = he
    ? "איך Kidsit AI אוספת, משתמשת ומגנה על המידע שלכם ושל ילדיכם."
    : "How Kidsit AI collects, uses and protects your information and your children's information.";
  return {
    title,
    description,
    twitter: { title, description },
    openGraph: { title, description, url: `/${params.lang}/privacy` },
    alternates: {
      canonical: `/${params.lang}/privacy`,
      languages: { en: "/en/privacy", he: "/he/privacy", "x-default": "/en/privacy" },
    },
  };
}

// Drafted from what the site and FAQ already say. Needs a legal read before it's final.
const SECTIONS: Section[] = [
  {
    id: "collect",
    h: "Information We Collect",
    p: "The app collects information you provide directly: children's names, ages, characteristics, and descriptions of situations. This information is stored on your device.",
  },
  {
    id: "voice",
    h: "Voice recordings and transcription",
    p: "When you use the microphone, your voice is transcribed to text transiently so the app can generate guidance. We do not retain your recordings. Nothing you say is used to train models.",
  },
  {
    id: "use",
    h: "How We Use Information",
    p: "Information is used solely to provide personalized parenting guidance. Situation descriptions are sent to external AI services (OpenAI and Anthropic) for processing and are not stored by us.",
  },
  {
    id: "sharing",
    h: "Third-Party Sharing",
    p: "Situation descriptions are sent to AI providers (OpenAI, Anthropic) to generate recommendations. These providers are subject to their own privacy policies. We do not sell personal information, and we do not show ads.",
  },
  {
    id: "retention",
    h: "Data Storage and Retention",
    p: "Moments and child profiles are stored on your device. We do not store them on our servers, so we keep nothing to retain once you delete the app.",
  },
  {
    id: "analytics",
    h: "Analytics and cookies on kidsit.ai",
    p: "This website uses Google Analytics 4 to understand how many people visit and which sections they read. It may set cookies in your browser. It does not receive anything you enter in the app.",
  },
  {
    id: "payments",
    h: "Subscriptions and payments",
    p: "Premium subscriptions are sold and billed by Apple (App Store) or Google (Google Play). We never see your card details. Manage or cancel a subscription from your App Store or Google Play subscriptions.",
  },
  {
    id: "children",
    h: "Children's information",
    p: "Kidsit AI is for parents and guardians aged 18 or over, not for children. Any information about a child is entered by their parent or guardian and is handled as described above.",
  },
  {
    id: "delete",
    h: "How to delete your data",
    p: <>Data stored on your device is removed when you delete the app. To ask us about access, correction or deletion of anything else, email {mail}.</>,
  },
  {
    id: "rights",
    h: "Your Rights",
    p: "Under the Israeli Privacy Protection Law and the GDPR, you have the right to access, correct, or delete your data. Contact us using the address below to exercise these rights.",
  },
  {
    id: "security",
    h: "Data Security",
    p: "We use HTTPS and standard security measures to protect information in transit and on our site.",
  },
  {
    id: "contact",
    h: "Contact Us",
    p: <>For privacy-related questions, email {mail}.</>,
  },
];

export default function Privacy({ params }: { params: { lang: Lang } }) {
  return (
    <LegalPage
      lang={params.lang}
      title="Privacy Policy"
      updated="October 2026"
      intro={`Kidsit AI ("the app") is committed to protecting your privacy and the privacy of your children. This policy explains how we collect, use, and protect your information.`}
      sections={SECTIONS}
    />
  );
}
