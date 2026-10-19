import type { Metadata } from "next";
import { ogFor } from "@/lib/seo";
import Link from "next/link";
import { LegalPage, type LegalDoc } from "@/components/legal";
import { ACCESSIBILITY_EMAIL, type Lang } from "@/dictionaries";

// Only /he and /en exist (params come from the [lang] layout); anything else is a 404, never a render with an unknown lang.
export const dynamicParams = false;

// Accessibility statement. The widget features listed here were checked against the self-hosted
// NagishLi 3.0 beta in /public/nagishli (options rendered by the live widget); items the widget marks
// as unavailable (audio reading, voice commands, hiding the widget) are deliberately not listed.
export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  const he = params.lang === "he";
  const title = he ? "הצהרת נגישות | Kidsit AI" : "Accessibility Statement | Kidsit AI";
  const description = he
    ? "הצהרת הנגישות של אתר kidsit.ai: מה עשינו, מה עדיין חסר ואיך לפנות אלינו בנושא נגישות."
    : "Accessibility statement for kidsit.ai: what we've done, known limitations, and how to report an issue.";
  return {
    title,
    description,
    ...ogFor(params.lang, title, description, "/accessibility"),
    alternates: {
      canonical: `/${params.lang}/accessibility`,
      languages: { en: "/en/accessibility", he: "/he/accessibility", "x-default": "/en/accessibility" },
    },
  };
}

const link = "text-grape underline underline-offset-2";
const list = "mt-2 list-disc space-y-1 ps-6";
const a11yMail = (
  <bdi>
    <a className={link} href={`mailto:${ACCESSIBILITY_EMAIL}`} dir="ltr">
      {ACCESSIBILITY_EMAIL}
    </a>
  </bdi>
);

const DOCS: Record<Lang, LegalDoc> = {
  en: {
    title: "Accessibility Statement",
    updated: "October 2026",
    intro:
      "Kidsit AI wants every parent to be able to use this website, including people with disabilities. This statement describes the accessibility of the kidsit.ai website, what we have done so far, what we know is still missing, and how to reach us.",
    sections: [
      {
        id: "standard",
        h: "Accessibility level we aim for",
        p: "We aim to meet Israeli Standard IS 5568, which is based on the Web Content Accessibility Guidelines (WCAG) 2.0 at level AA, as required by the Equal Rights for Persons with Disabilities (Service Accessibility Adjustments) Regulations, 2013. The site has not been formally audited or certified, and we do not claim full compliance. We are working on it and fix issues as we find them.",
      },
      {
        id: "scope",
        h: "Scope",
        p: "This statement covers the kidsit.ai website in Hebrew and English. It does not cover the Kidsit AI mobile app, the App Store or Google Play listings, or third-party sites we link to. Kidsit AI is an online service with no physical location open to the public.",
      },
      {
        id: "done",
        h: "What we have done on the site",
        p: (
          <ul className={list}>
            <li>Each page declares its language and text direction (Hebrew pages are right-to-left).</li>
            <li>Pages use a heading structure and labelled navigation areas.</li>
            <li>The mobile menu and the FAQ can be opened and closed with the keyboard, report their open or closed state to screen readers, and the menu closes with Esc.</li>
            <li>Images have text alternatives, and the demo video has captions in Hebrew and English.</li>
            <li>Animations are reduced when your device is set to reduce motion.</li>
            <li>The main buttons and navigation links have touch targets of at least 44 pixels.</li>
          </ul>
        ),
      },
      {
        id: "widget",
        h: "The accessibility menu (NagishLi)",
        p: (
          <>
            <p>
              Every page includes the NagishLi accessibility menu (version 3.0 beta). Open it from the accessibility
              button on the page. It lets you:
            </p>
            <ul className={list}>
              <li>Make text bigger or smaller, and increase line spacing and word spacing</li>
              <li>Align text to the right, center or left</li>
              <li>Apply color filters: Color Blind (grayscale), Impaired Vision (inverted colors), Blue Light Filter, Cold Colors, Bold Colors and High Brightness</li>
              <li>Choose your own text color and background color</li>
              <li>Show images only or text only</li>
              <li>Highlight links and headings</li>
              <li>Use keyboard navigation, and jump to areas of the page with quick navigation</li>
              <li>Reset all settings</li>
            </ul>
          </>
        ),
      },
      {
        id: "limitations",
        h: "Known limitations",
        p: (
          <ul className={list}>
            <li>Some app screenshots on the English pages are in English; the Hebrew landing page shows a Hebrew screenshot. Their content is described in their text alternatives.</li>
            <li>The accessibility menu is a beta version. It does not offer audio reading or voice commands.</li>
            <li>Links to the App Store and Google Play lead to sites that we do not control.</li>
          </ul>
        ),
      },
      {
        id: "contact",
        h: "Reporting an accessibility issue",
        p: (
          <>
            <p>
              If something on the site is hard or impossible for you to use, or you need information in another
              format, please email {a11yMail}. To help us fix it, please include:
            </p>
            <ul className={list}>
              <li>The page address (URL)</li>
              <li>What you tried to do and what went wrong</li>
              <li>Your device, browser, and any assistive technology you use (for example a screen reader)</li>
            </ul>
            <p className="mt-2">
              For help with the app itself, see our <Link className={link} href="/en/support">support page</Link>.
            </p>
          </>
        ),
      },
      {
        id: "date",
        h: "Date of this statement",
        p: "This statement was prepared in October 2026. We will update it as the site changes.",
      },
    ],
  },
  he: {
    title: "הצהרת נגישות",
    updated: "אוקטובר 2026",
    intro:
      "ב-Kidsit AI חשוב לנו שכל הורה יוכל להשתמש באתר, כולל אנשים עם מוגבלות. הצהרה זו מתארת את מצב הנגישות של אתר kidsit.ai: מה עשינו עד כה, מה ידוע לנו שעדיין חסר, ואיך אפשר לפנות אלינו.",
    sections: [
      {
        id: "standard",
        h: "רמת הנגישות שאליה אנו שואפים",
        p: "אנו שואפים לעמוד בדרישות התקן הישראלי ת\"י 5568, המבוסס על הנחיות הנגישות לתכני אינטרנט (WCAG) 2.0 ברמה AA, כנדרש בתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע\"ג-2013. האתר לא עבר בדיקה רשמית או הסמכה, ואיננו טוענים לעמידה מלאה בתקן. אנו ממשיכים לעבוד על הנגישות ומתקנים ליקויים כשאנו מאתרים אותם.",
      },
      {
        id: "scope",
        h: "היקף ההצהרה",
        p: "ההצהרה חלה על אתר kidsit.ai בעברית ובאנגלית. היא אינה חלה על אפליקציית Kidsit AI, על דפי האפליקציה ב-App Store וב-Google Play, או על אתרים של צדדים שלישיים שאליהם אנו מקשרים. Kidsit AI היא שירות מקוון, ואין לה מקום פיזי שפתוח לקהל.",
      },
      {
        id: "done",
        h: "מה עשינו באתר",
        p: (
          <ul className={list}>
            <li>בכל עמוד מוגדרים השפה וכיוון הטקסט (העמודים בעברית מוצגים מימין לשמאל).</li>
            <li>העמודים בנויים במבנה כותרות, ואזורי הניווט מסומנים בתוויות.</li>
            <li>את התפריט במובייל ואת השאלות הנפוצות אפשר לפתוח ולסגור במקלדת, הם מדווחים לקוראי מסך אם הם פתוחים או סגורים, ואת התפריט אפשר לסגור במקש Esc.</li>
            <li>לתמונות יש חלופה טקסטואלית, ולסרטון ההדגמה יש כתוביות בעברית ובאנגלית.</li>
            <li>האנימציות מצטמצמות כשבמכשיר מוגדרת העדפה להפחתת תנועה.</li>
            <li>לכפתורים הראשיים ולקישורי הניווט יש אזור לחיצה בגודל 44 פיקסלים לפחות.</li>
          </ul>
        ),
      },
      {
        id: "widget",
        h: "תפריט הנגישות (נגיש לי)",
        p: (
          <>
            <p>
              בכל עמודי האתר מותקן תפריט הנגישות &quot;נגיש לי&quot; (NagishLi, גרסה 3.0 בטא). פותחים אותו בלחיצה על
              כפתור הנגישות בעמוד. התפריט מאפשר:
            </p>
            <ul className={list}>
              <li>הגדלה והקטנה של הטקסט, והגדלת המרווח בין השורות ובין המילים</li>
              <li>יישור הטקסט לימין, למרכז או לשמאל</li>
              <li>מסנני צבע: עיוורי צבעים (גווני אפור), כבדי ראייה (היפוך צבעים), מסנן אור כחול, צבעים קרים, צבעים עזים ובהירות גבוהה</li>
              <li>בחירת צבע טקסט וצבע רקע</li>
              <li>הצגת תמונות בלבד או טקסט בלבד</li>
              <li>הדגשת קישורים וכותרות</li>
              <li>ניווט במקלדת, וקפיצה לאזורים בעמוד באמצעות ניווט מהיר</li>
              <li>איפוס כל ההגדרות</li>
            </ul>
          </>
        ),
      },
      {
        id: "limitations",
        h: "מגבלות ידועות",
        p: (
          <ul className={list}>
            <li>חלק מצילומי האפליקציה בעמודים באנגלית הם באנגלית; בעמוד הנחיתה בעברית מוצג צילום מסך בעברית. התוכן שלהם מתואר בחלופה הטקסטואלית.</li>
            <li>תפריט הנגישות הוא גרסת בטא, והוא אינו כולל הקראה קולית או פקודות קוליות.</li>
            <li>הקישורים ל-App Store ול-Google Play מובילים לאתרים שאינם בשליטתנו.</li>
          </ul>
        ),
      },
      {
        id: "contact",
        h: "דיווח על בעיית נגישות",
        p: (
          <>
            <p>
              אם משהו באתר קשה לכם לשימוש או אינו נגיש, או שאתם צריכים מידע בפורמט אחר, כתבו לנו לכתובת {a11yMail}.
              כדי שנוכל לטפל בפנייה, נשמח אם תציינו:
            </p>
            <ul className={list}>
              <li>כתובת העמוד (URL)</li>
              <li>מה ניסיתם לעשות ומה לא עבד</li>
              <li>המכשיר, הדפדפן וטכנולוגיה מסייעת שבה אתם משתמשים (למשל קורא מסך)</li>
            </ul>
            <p className="mt-2">
              לעזרה באפליקציה עצמה, ראו את <Link className={link} href="/he/support">עמוד התמיכה</Link>.
            </p>
          </>
        ),
      },
      {
        id: "date",
        h: "תאריך ההצהרה",
        p: "הצהרה זו נערכה באוקטובר 2026. נעדכן אותה כשהאתר ישתנה.",
      },
    ],
  },
};

export default function Accessibility({ params }: { params: { lang: Lang } }) {
  return <LegalPage lang={params.lang} path="/accessibility" doc={DOCS[params.lang]} />;
}
