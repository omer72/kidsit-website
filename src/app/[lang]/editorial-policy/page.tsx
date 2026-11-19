import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, mail, type LegalDoc } from "@/components/legal";
import { ogFor } from "@/lib/seo";
import type { Lang } from "@/dictionaries";

// Only /he and /en exist (params come from the [lang] layout); anything else is a 404.
export const dynamicParams = false;

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  const he = params.lang === "he";
  const title = he ? "מדיניות עריכה | Kidsit AI" : "Editorial Policy | Kidsit AI";
  const description = he
    ? "איך נכתבים מאמרי הבלוג של Kidsit: מאילו מקורות אנחנו נשענים, איך אנחנו בודקים אותם, ואיך מדווחים על טעות."
    : "How the Kidsit blog is written: which sources we rely on, how we check them, and how to report a mistake.";
  return {
    title,
    description,
    ...ogFor(params.lang, title, description, "/editorial-policy"),
    alternates: {
      canonical: `/${params.lang}/editorial-policy`,
      languages: { en: "/en/editorial-policy", he: "/he/editorial-policy", "x-default": "/en/editorial-policy" },
    },
  };
}

const link = "text-grape underline underline-offset-2";
const list = "mt-2 list-disc space-y-1 ps-6";

// Describes only what the site already does: the "Kidsit Team" byline, the updated date, the Sources list at the end of an
// article (title, publisher, link, and a checked-on date kept per source), the medical disclaimer, and the optional
// reviewer line. No named reviewers and no credentials are claimed, because none are listed for any article.
const DOCS: Record<Lang, (base: string) => LegalDoc> = {
  en: (base) => ({
    title: "Editorial Policy",
    updated: "November 2026",
    intro:
      "This page explains how the articles on the Kidsit blog are written and checked. The blog is written by the Kidsit team, and it is guidance for everyday parenting moments, not medical advice.",
    sections: [
      {
        id: "authors",
        h: "Who writes",
        p: (
          <>
            Articles are published under the byline “Kidsit Team”. Read more <Link className={link} href={`${base}/about`}>about us</Link>.
          </>
        ),
      },
      {
        id: "sources",
        h: "Sources",
        p: (
          <>
            <p>Claims about child development, health, or safety are tied to a source, and the sources an article relies on are listed at the end of it, with the publisher and a link. We prefer:</p>
            <ul className={list}>
              <li>Israeli public health bodies, such as the Ministry of Health;</li>
              <li>pediatric and health organizations, such as the American Academy of Pediatrics (HealthyChildren.org) and the NHS;</li>
              <li>published research, such as papers indexed on PubMed;</li>
              <li>for what a product does or costs, the company’s own help or pricing pages.</li>
            </ul>
            <p className="mt-2">Other articles and parent communities can add practical ideas, but a health or safety claim does not rest on them alone.</p>
          </>
        ),
      },
      {
        id: "checking",
        h: "How we check",
        p: (
          <>
            <p>For each source we keep a record of what it supports and the date we last checked it. An article shows the date it was last updated under its title. When we update an article, we re-check its sources and links.</p>
            <p className="mt-2">Today, articles do not carry a named professional reviewer. If that changes, an article reviewed by a named professional will say so under its title, with the reviewer’s name and role. Until then, no article is presented as professionally reviewed.</p>
          </>
        ),
      },
      {
        id: "advice",
        h: "Not medical advice",
        p: "Articles are general guidance and do not replace advice from your pediatrician or another licensed professional. If you are worried about your child’s safety, development, or health, or you are struggling yourself, talk to a professional. Where an article describes a warning sign, it says so.",
      },
      {
        id: "language",
        h: "Hebrew and English",
        p: "The blog is published in Hebrew and in English. Not every Hebrew article has an English version yet, and an English article may link to a Hebrew one when no English version exists. Such links are marked “(in Hebrew)”.",
      },
      {
        id: "corrections",
        h: "Corrections",
        p: <>If you find a mistake, an outdated source, or a broken link, write to {mail} with the article’s address. We review it and update the article and its “Updated” date.</>,
      },
    ],
  }),
  he: (base) => ({
    title: "מדיניות עריכה",
    updated: "נובמבר 2026",
    intro:
      "בעמוד הזה אנחנו מסבירים איך מאמרי הבלוג של Kidsit נכתבים ונבדקים. את הבלוג כותב צוות Kidsit, והוא הדרכה לרגעים יומיומיים של הורות, לא ייעוץ רפואי.",
    sections: [
      {
        id: "authors",
        h: "מי כותב",
        p: (
          <>
            המאמרים מתפרסמים תחת הכיתוב “צוות Kidsit”. עוד <Link className={link} href={`${base}/about`}>עלינו</Link>.
          </>
        ),
      },
      {
        id: "sources",
        h: "מקורות",
        p: (
          <>
            <p>טענות על התפתחות ילדים, בריאות או בטיחות נשענות על מקור, והמקורות שמאמר נשען עליהם מופיעים בסופו, עם שם הגוף המפרסם וקישור. אנחנו מעדיפים:</p>
            <ul className={list}>
              <li>גופי בריאות ציבוריים בישראל, כמו משרד הבריאות;</li>
              <li>ארגוני רפואת ילדים ובריאות, כמו האקדמיה האמריקאית לרפואת ילדים (HealthyChildren.org) ושירות הבריאות הבריטי (NHS);</li>
              <li>מחקר שפורסם, כמו מאמרים שמופיעים ב-PubMed;</li>
              <li>כשמדובר במה שמוצר עושה או כמה הוא עולה, דפי העזרה או המחירים של החברה עצמה.</li>
            </ul>
            <p className="mt-2">מאמרים אחרים וקבוצות הורים יכולים להוסיף רעיונות מעשיים, אבל טענה בנושא בריאות או בטיחות לא נשענת עליהם לבדם.</p>
          </>
        ),
      },
      {
        id: "checking",
        h: "איך אנחנו בודקים",
        p: (
          <>
            <p>לכל מקור אנחנו שומרים תיעוד של מה שהוא תומך בו ושל התאריך שבו בדקנו אותו לאחרונה. מתחת לכותרת של כל מאמר מופיע תאריך העדכון האחרון שלו. כשאנחנו מעדכנים מאמר, אנחנו בודקים מחדש את המקורות והקישורים שלו.</p>
            <p className="mt-2">נכון להיום, מאמרים אינם נושאים שם של בודק מקצועי. אם זה ישתנה, מאמר שנבדק על ידי איש מקצוע בשמו יציין זאת מתחת לכותרת, עם שמו ותפקידו. עד אז, אף מאמר לא מוצג כמאמר שנבדק מקצועית.</p>
          </>
        ),
      },
      {
        id: "advice",
        h: "לא ייעוץ רפואי",
        p: "המאמרים הם הדרכה כללית ואינם מחליפים ייעוץ של רופא הילדים או של איש מקצוע מוסמך אחר. אם אתם מודאגים לגבי הביטחון, ההתפתחות או הבריאות של הילד, או אם קשה לכם בעצמכם, פנו לאיש מקצוע. כשמאמר מתאר סימן אזהרה, הוא אומר זאת במפורש.",
      },
      {
        id: "language",
        h: "עברית ואנגלית",
        p: "הבלוג מתפרסם בעברית ובאנגלית. לא לכל מאמר בעברית יש עדיין גרסה באנגלית, ומאמר באנגלית עשוי לקשר למאמר בעברית כשאין לו גרסה באנגלית. קישורים כאלה מסומנים “(in Hebrew)”.",
      },
      {
        id: "corrections",
        h: "תיקונים",
        p: <>מצאתם טעות, מקור שהתיישן או קישור שבור? כתבו ל-{mail} עם כתובת המאמר. אנחנו בודקים, ומעדכנים את המאמר ואת תאריך העדכון שלו.</>,
      },
    ],
  }),
};

export default function EditorialPolicyPage({ params }: { params: { lang: Lang } }) {
  return <LegalPage lang={params.lang} path="/editorial-policy" doc={DOCS[params.lang](`/${params.lang}`)} />;
}
