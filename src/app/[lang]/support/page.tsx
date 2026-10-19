import type { Metadata } from "next";
import { ogFor } from "@/lib/seo";
import Link from "next/link";
import { LegalPage, mail, type LegalDoc } from "@/components/legal";
import { SUPPORT_EMAIL, type Lang } from "@/dictionaries";

// Only /he and /en exist (params come from the [lang] layout); anything else is a 404, never a render with an unknown lang.
export const dynamicParams = false;

// Used as the App Store / Google Play "Support URL". Contact is by email only (mailto); there is no form.
export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  const he = params.lang === "he";
  const title = he ? "תמיכה ויצירת קשר | Kidsit AI" : "Support & Contact | Kidsit AI";
  const description = he
    ? "צריכים עזרה עם Kidsit AI? כתבו לנו במייל, וכך תקבלו מענה מהיר יותר."
    : "Need help with Kidsit AI? Email us. Here's what to include so we can help quickly.";
  return {
    title,
    description,
    ...ogFor(params.lang, title, description, "/support"),
    alternates: {
      canonical: `/${params.lang}/support`,
      languages: { en: "/en/support", he: "/he/support", "x-default": "/en/support" },
    },
  };
}

const link = "text-grape underline underline-offset-2";
const list = "mt-2 list-disc space-y-1 ps-6";

const DOCS: Record<Lang, LegalDoc> = {
  en: {
    title: "Support",
    updated: "October 2026",
    intro: "Questions, a bug, or a billing issue? Email us and a real person (the parent who built Kidsit AI) will read it.",
    sections: [
      {
        id: "email",
        h: "Email us",
        p: (
          <>
            <p>
              Write to {mail}. This is our only support address.
            </p>
            <p className="mt-4">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Kidsit AI support")}`}
                className="inline-flex min-h-11 items-center rounded-xl border-2 border-ink bg-grape px-5 font-bold text-white shadow-sticker-sm"
              >
                Email support
              </a>
            </p>
          </>
        ),
      },
      {
        id: "include",
        h: "What to include",
        p: (
          <ul className={list}>
            <li>Your phone model and its iOS or Android version</li>
            <li>The app version (shown in your App Store or Google Play listing)</li>
            <li>What you did, what you expected, and what happened instead</li>
            <li>A screenshot, if it helps</li>
            <li>For billing questions: whether you subscribed through the App Store or Google Play</li>
          </ul>
        ),
      },
      {
        id: "faq",
        h: "Common questions",
        p: (
          <>
            <h3 className="mt-2 font-display text-lg font-semibold">How do I cancel my subscription?</h3>
            <p>
              Subscriptions are managed by Apple or Google. On iPhone: Settings → [your name] → Subscriptions. On
              Android: Google Play → Profile → Payments &amp; subscriptions → Subscriptions.
            </p>
            <h3 className="mt-4 font-display text-lg font-semibold">How do I delete my data?</h3>
            <p>
              Moments and child profiles are stored on your device, so deleting the app removes them. For anything
              else, email us. See the <Link className={link} href="/en/privacy#delete">Privacy Policy</Link>.
            </p>
            <h3 className="mt-4 font-display text-lg font-semibold">Is this an emergency service?</h3>
            <p>
              No. Kidsit AI is not medical or psychological advice. If your child may be in danger, contact your
              local emergency services.
            </p>
          </>
        ),
      },
      {
        id: "legal",
        h: "Privacy and terms",
        p: (
          <ul className={list}>
            <li>
              <Link className={link} href="/en/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link className={link} href="/en/terms">Terms of Service</Link>
            </li>
          </ul>
        ),
      },
    ],
  },
  he: {
    title: "תמיכה",
    updated: "אוקטובר 2026",
    intro: "יש שאלה, תקלה או בעיה בחיוב? כתבו לנו, ואדם אמיתי (ההורה שבנה את Kidsit AI) יקרא את הפנייה.",
    sections: [
      {
        id: "email",
        h: "כתבו לנו",
        p: (
          <>
            <p>כתבו לנו לכתובת {mail}. זו כתובת התמיכה היחידה שלנו.</p>
            <p className="mt-4">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("תמיכה - Kidsit AI")}`}
                className="inline-flex min-h-11 items-center rounded-xl border-2 border-ink bg-grape px-5 font-bold text-white shadow-sticker-sm"
              >
                שליחת מייל לתמיכה
              </a>
            </p>
          </>
        ),
      },
      {
        id: "include",
        h: "מה כדאי לכתוב בפנייה",
        p: (
          <ul className={list}>
            <li>דגם הטלפון וגרסת ה-iOS או האנדרואיד</li>
            <li>גרסת האפליקציה (מופיעה בדף האפליקציה ב-App Store או ב-Google Play)</li>
            <li>מה עשיתם, מה ציפיתם שיקרה ומה קרה בפועל</li>
            <li>צילום מסך, אם זה עוזר</li>
            <li>בשאלות על חיוב: האם נרשמתם למנוי דרך ה-App Store או דרך Google Play</li>
          </ul>
        ),
      },
      {
        id: "faq",
        h: "שאלות נפוצות",
        p: (
          <>
            <h3 className="mt-2 font-display text-lg font-semibold">איך מבטלים מנוי?</h3>
            <p>
              המנויים מנוהלים על ידי Apple או Google. באייפון: הגדרות ← [השם שלכם] ← מנויים. באנדרואיד: Google Play ←
              פרופיל ← תשלומים ומנויים ← מנויים.
            </p>
            <h3 className="mt-4 font-display text-lg font-semibold">איך מוחקים את המידע שלי?</h3>
            <p>
              הרגעים ופרופילי הילדים נשמרים במכשיר שלכם, ולכן מחיקת האפליקציה מוחקת אותם. בכל עניין אחר, כתבו לנו.
              פרטים נוספים ב<Link className={link} href="/he/privacy#delete">מדיניות הפרטיות</Link>.
            </p>
            <h3 className="mt-4 font-display text-lg font-semibold">זה שירות חירום?</h3>
            <p>
              לא. Kidsit AI אינה ייעוץ רפואי או פסיכולוגי. אם ילדכם עלול להיות בסכנה, פנו לשירותי החירום.
            </p>
          </>
        ),
      },
      {
        id: "legal",
        h: "פרטיות ותנאי שימוש",
        p: (
          <ul className={list}>
            <li>
              <Link className={link} href="/he/privacy">מדיניות פרטיות</Link>
            </li>
            <li>
              <Link className={link} href="/he/terms">תנאי שימוש</Link>
            </li>
          </ul>
        ),
      },
    ],
  },
};

export default function Support({ params }: { params: { lang: Lang } }) {
  return <LegalPage lang={params.lang} path="/support" doc={DOCS[params.lang]} />;
}
