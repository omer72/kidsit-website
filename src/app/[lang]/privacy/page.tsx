import type { Metadata } from "next";
import { ogFor } from "@/lib/seo";
import { LegalPage, mail, type LegalDoc } from "@/components/legal";
import type { Lang } from "@/dictionaries";

// Only /he and /en exist (params come from the [lang] layout); anything else is a 404, never a render with an unknown lang.
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  const he = params.lang === "he";
  const title = he ? "מדיניות פרטיות | Kidsit AI" : "Privacy Policy | Kidsit AI";
  const description = he
    ? "איך Kidsit AI אוספת, משתמשת ומגנה על המידע שלכם ושל ילדיכם."
    : "How Kidsit AI collects, uses and protects your information and your children's information.";
  return {
    title,
    description,
    ...ogFor(params.lang, title, description, "/privacy"),
    alternates: {
      canonical: `/${params.lang}/privacy`,
      languages: { en: "/en/privacy", he: "/he/privacy", "x-default": "/en/privacy" },
    },
  };
}

// Drafted from what the site and FAQ already say. Needs a legal read before it's final.
// The Hebrew version is a translation of the English one; keep the two in sync.
const DOCS: Record<Lang, LegalDoc> = {
  en: {
    title: "Privacy Policy",
    updated: "October 2026",
    intro: `Kidsit AI ("the app") is committed to protecting your privacy and the privacy of your children. This policy explains how we collect, use, and protect your information.`,
    sections: [
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
    ],
  },
  he: {
    title: "מדיניות פרטיות",
    updated: "אוקטובר 2026",
    intro: `Kidsit AI‏ ("האפליקציה") מחויבת להגנה על פרטיותכם ועל פרטיות ילדיכם. מדיניות זו מסבירה כיצד אנו אוספים מידע, משתמשים בו ומגנים עליו.`,
    sections: [
      {
        id: "collect",
        h: "המידע שאנו אוספים",
        p: "האפליקציה אוספת מידע שאתם מוסרים לה ישירות: שמות הילדים, גילם, מאפייניהם ותיאורים של סיטואציות. מידע זה נשמר במכשיר שלכם.",
      },
      {
        id: "voice",
        h: "הקלטות קוליות ותמלול",
        p: "כאשר אתם משתמשים במיקרופון, הקול שלכם מתומלל לטקסט באופן זמני, כדי שהאפליקציה תוכל להפיק הדרכה. איננו שומרים את ההקלטות שלכם. שום דבר שאתם אומרים אינו משמש לאימון מודלים.",
      },
      {
        id: "use",
        h: "כיצד אנו משתמשים במידע",
        p: "המידע משמש אך ורק לצורך מתן הדרכת הורות מותאמת אישית. תיאורי הסיטואציות נשלחים לעיבוד אצל שירותי בינה מלאכותית חיצוניים (OpenAI ו-Anthropic), ואינם נשמרים אצלנו.",
      },
      {
        id: "sharing",
        h: "שיתוף מידע עם צדדים שלישיים",
        p: "תיאורי הסיטואציות נשלחים לספקי בינה מלאכותית (OpenAI, ‏Anthropic) לצורך הפקת המלצות. ספקים אלה כפופים למדיניות הפרטיות שלהם. איננו מוכרים מידע אישי ואיננו מציגים פרסומות.",
      },
      {
        id: "retention",
        h: "אחסון ושמירת מידע",
        p: "הרגעים ופרופילי הילדים נשמרים במכשיר שלכם. איננו שומרים אותם בשרתים שלנו, ולכן לאחר מחיקת האפליקציה לא נותר אצלנו מידע לשמור.",
      },
      {
        id: "analytics",
        h: "ניתוח נתונים ועוגיות (Cookies) באתר kidsit.ai",
        p: "אתר זה משתמש ב-Google Analytics 4 כדי להבין כמה אנשים מבקרים בו ואילו חלקים הם קוראים. השירות עשוי לשמור עוגיות (Cookies) בדפדפן שלכם. הוא אינו מקבל דבר ממה שאתם מזינים באפליקציה.",
      },
      {
        id: "payments",
        h: "מנויים ותשלומים",
        p: "מנויי פרימיום נמכרים ומחויבים על ידי Apple ‏(App Store) או Google ‏(Google Play). איננו רואים לעולם את פרטי כרטיס האשראי שלכם. ניהול מנוי או ביטולו נעשים דרך המנויים שלכם ב-App Store או ב-Google Play.",
      },
      {
        id: "children",
        h: "מידע על ילדים",
        p: "Kidsit AI מיועדת להורים ולאפוטרופסים בני 18 ומעלה, ולא לילדים. כל מידע על ילד מוזן על ידי ההורה או האפוטרופוס שלו, והטיפול בו נעשה כמתואר לעיל.",
      },
      {
        id: "delete",
        h: "כיצד למחוק את המידע שלכם",
        p: <>המידע השמור במכשיר שלכם נמחק עם מחיקת האפליקציה. לפניות בנוגע לעיון, לתיקון או למחיקה של כל מידע אחר, כתבו אלינו לכתובת {mail}.</>,
      },
      {
        id: "rights",
        h: "הזכויות שלכם",
        p: "בהתאם לחוק הגנת הפרטיות הישראלי ולתקנה הכללית להגנה על מידע של האיחוד האירופי (GDPR), עומדת לכם הזכות לעיין במידע שלכם, לתקנו או למחוק אותו. למימוש זכויות אלה, פנו אלינו בכתובת המופיעה להלן.",
      },
      {
        id: "security",
        h: "אבטחת מידע",
        p: "אנו משתמשים ב-HTTPS ובאמצעי אבטחה מקובלים כדי להגן על המידע בזמן העברתו ובאתר שלנו.",
      },
      {
        id: "contact",
        h: "יצירת קשר",
        p: <>לשאלות בנושא פרטיות, כתבו אלינו לכתובת {mail}.</>,
      },
    ],
  },
};

export default function Privacy({ params }: { params: { lang: Lang } }) {
  return <LegalPage lang={params.lang} path="/privacy" doc={DOCS[params.lang]} />;
}
