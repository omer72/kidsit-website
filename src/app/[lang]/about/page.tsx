import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, mail, type LegalDoc } from "@/components/legal";
import { ogFor } from "@/lib/seo";
import type { Lang } from "@/dictionaries";

// Only /he and /en exist (params come from the [lang] layout); anything else is a 404.
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  const he = params.lang === "he";
  const title = he ? "אודות | Kidsit AI" : "About | Kidsit AI";
  const description = he
    ? "מי אנחנו, מה Kidsit AI עושה ומה היא לא עושה, ואיך אנחנו כותבים את המאמרים בבלוג."
    : "Who we are, what Kidsit AI does and does not do, and how we write the articles on the blog.";
  return {
    title,
    description,
    ...ogFor(params.lang, title, description, "/about"),
    alternates: {
      canonical: `/${params.lang}/about`,
      languages: { en: "/en/about", he: "/he/about", "x-default": "/en/about" },
    },
  };
}

const link = "text-grape underline underline-offset-2";

// Only facts that are already stated elsewhere on the site (home page, FAQ, footer, blog bylines). No names, no credentials.
const DOCS: Record<Lang, (path: string) => LegalDoc> = {
  en: (base) => ({
    title: "About Kidsit AI",
    updated: "November 2026",
    intro:
      "Kidsit AI is an app that gives parents calm, practical guidance for the hard moments of the day. This site is its home, and it also holds a blog with short guides for those moments. The site and its articles are written by the Kidsit team.",
    sections: [
      {
        id: "what",
        h: "What Kidsit AI does",
        p: "Hold the mic, tell the app what just happened, and get a short plan with words you can say right now. It is built by a parent, for parents, and it works on iPhone and Android. The first 3 guidance answers are free, for one child, with no account. After that, a new answer needs Premium.",
      },
      {
        id: "not",
        h: "What it is not",
        p: "Kidsit AI is not a substitute for professional, medical, or psychological advice, and it is not therapy or personal parent coaching. If you are worried about your child's safety, development, or health, or you are struggling yourself, talk to your pediatrician or a licensed professional.",
      },
      {
        id: "articles",
        h: "Who writes the articles",
        p: (
          <>
            The articles on the blog are written by the Kidsit team, and each one says so under its title, with the date it was last updated and the sources it relies on at the end. We explain how we choose and check those sources in our{" "}
            <Link className={link} href={`${base}/editorial-policy`}>
              editorial policy
            </Link>
            .
          </>
        ),
      },
      {
        id: "contact",
        h: "Contact",
        p: <>Questions, corrections, or feedback: write to {mail}. You can also find our support page <Link className={link} href={`${base}/support`}>here</Link>.</>,
      },
    ],
  }),
  he: (base) => ({
    title: "אודות Kidsit AI",
    updated: "נובמבר 2026",
    intro:
      "Kidsit AI היא אפליקציה שנותנת להורים הדרכה רגועה ומעשית לרגעים הקשים של היום. האתר הזה הוא הבית שלה, ויש בו גם בלוג עם מדריכים קצרים לאותם רגעים. את האתר והמאמרים כותב צוות Kidsit.",
    sections: [
      {
        id: "what",
        h: "מה Kidsit AI עושה",
        p: "מחזיקים את המיקרופון, מספרים לאפליקציה מה קרה הרגע, ומקבלים תוכנית קצרה עם משפטים שאפשר להגיד כבר עכשיו. היא נבנתה על ידי הורה, בשביל הורים, ופועלת באייפון ובאנדרואיד. 3 תשובות ההדרכה הראשונות בחינם, בלי חשבון ובלי הגבלת מספר ילדים. אחרי זה, תשובה חדשה דורשת Premium.",
      },
      {
        id: "not",
        h: "מה היא לא",
        p: "Kidsit AI אינה תחליף לייעוץ מקצועי, רפואי או פסיכולוגי, והיא לא טיפול ולא ליווי הורים אישי. אם אתם מודאגים לגבי הביטחון, ההתפתחות או הבריאות של הילד, או אם קשה לכם בעצמכם, פנו לרופא הילדים או לאיש מקצוע מוסמך.",
      },
      {
        id: "articles",
        h: "מי כותב את המאמרים",
        p: (
          <>
            את מאמרי הבלוג כותב צוות Kidsit. כל מאמר מציין זאת מתחת לכותרת, יחד עם תאריך העדכון האחרון, ובסופו מופיעים המקורות שעליהם הוא נשען. איך אנחנו בוחרים ובודקים את המקורות מוסבר ב
            <Link className={link} href={`${base}/editorial-policy`}>
              מדיניות העריכה
            </Link>
            .
          </>
        ),
      },
      {
        id: "contact",
        h: "יצירת קשר",
        p: <>שאלות, תיקונים או משוב: כתבו לנו ל-{mail}. אפשר גם להיכנס ל<Link className={link} href={`${base}/support`}>עמוד התמיכה</Link>.</>,
      },
    ],
  }),
};

export default function AboutPage({ params }: { params: { lang: Lang } }) {
  return <LegalPage lang={params.lang} path="/about" doc={DOCS[params.lang](`/${params.lang}`)} />;
}
