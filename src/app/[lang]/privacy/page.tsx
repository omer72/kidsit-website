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

// Drafted from what the site, the app, and the FAQ already say. Needs a legal read before it's final.
// The Hebrew version is a translation of the English one; keep the two in sync.
// Updated November 2026 for on-device digests and optional anonymous insights.
// Updated November 9, 2026: disclose the session-only visit-source record (store-link attribution) in the cookie section.
// Updated November 3, 2026: disclose the Meta Pixel (analytics consent only) in the cookie section.
// Updated November 1, 2026: a guidance request carries only the active child's story, context,
// profile, and eight recent moments, plus a RevenueCat ID. Other children and the optional
// moment note are not included.
const DOCS: Record<Lang, LegalDoc> = {
  en: {
    title: "Privacy Policy",
    updated: "November 9, 2026",
    intro: `Kidsit AI ("the app") is committed to protecting your privacy and the privacy of your children. This policy explains how we collect, use, and protect your information.`,
    sections: [
      {
        id: "collect",
        h: "Information We Collect",
        p: "The app collects information you provide directly: children's names, ages, characteristics, and descriptions of situations, your rating of each moment (it got worse, about the same, it helped, or it helped a lot), and an optional note. This information is stored on your device. If you separately choose to send anonymous insights, we receive only the summary described under “Weekly digest and anonymous insights”.",
      },
      {
        id: "voice",
        h: "Voice recordings and transcription",
        p: "When you use the microphone, your voice is sent to OpenAI Whisper (whisper-1) and transcribed to text transiently so the app can generate guidance. We do not retain your recordings. Nothing you say is used to train models.",
      },
      {
        id: "use",
        h: "How We Use Information",
        p: "Information stored on your device is used to give you personalized parenting guidance and, if you turn it on, a digest calculated on the device. A guidance request is sent to our functions on Netlify. That request includes only the child you asked about: the story text, the context you chose (location, your mood, who else was there, and how urgent it feels), that child's profile (name, birth date, gender, intake answers, notes, and whether a new baby recently joined the family, without the baby's name), and that child's eight most recent moments (each moment's story, a short summary of the earlier guidance and its advice headlines, your rating, and, when saved, when and where it happened and your mood). It also includes a RevenueCat ID so the function can check the subscription. Names, profiles, and history of other children are not sent. If an older version of the app still includes them, the function leaves them out of the prompt. The optional moment note stays on your device and is not included in the request. OpenAI's gpt-4o-mini model then receives the story, that context, that child's profile, and up to five of those recent moments. The RevenueCat ID is not part of the text sent to the model. We do not store those prompts.",
      },
      {
        id: "sharing",
        h: "Third-Party Sharing",
        p: (
          <>
            <p>We do not sell personal information. We do not show ads in the app or on this site. We advertise Kidsit on Meta&apos;s platforms and, with your consent, measure those ads using the Meta Pixel. The providers below match what the app and this site actually use:</p>
            <ul className="mt-3 list-disc space-y-2 ps-5">
              <li>OpenAI: gpt-4o-mini writes guidance and Whisper (whisper-1) transcribes voice, as described above. OpenAI&apos;s privacy policy applies to that processing.</li>
              <li>Netlify: hosts the guidance and transcription functions. Those requests pass through Netlify. Netlify&apos;s logs can include an IP address. Anonymous insights are not sent to Netlify, and we do not copy that IP into the insights database.</li>
              <li>RevenueCat: checks whether a subscription is active. The app sends RevenueCat an app user id, and the Netlify function can send that same id when it checks the entitlement. Apple or Google bills you. We never see your card number.</li>
              <li>Insert Affiliate: if you open the app from an affiliate link, an affiliate identifier is stored on the RevenueCat subscriber. It is not sent with anonymous insights.</li>
              <li>Vercel: hosts this website (kidsit.ai) and the anonymous insights endpoint. Vercel request logs include IP addresses for the retention period of the plan. We do not copy the IP address or the request body into our insights database.</li>
              <li>Neon: Postgres, connected to our Vercel project, stores anonymous insight submissions you choose to send. See “Weekly digest and anonymous insights”.</li>
              <li>Google: Google Analytics 4 and store-click measurement on this website only, after you accept cookies. They do not receive what you enter in the app. Details are under “Cookies and local storage”.</li>
              <li>Meta Platforms: the Meta Pixel on this website only, after you accept analytics cookies, to measure our ads and site visits. It does not receive what you enter in the app. Details are under “Cookies and local storage”.</li>
            </ul>
          </>
        ),
      },
      {
        id: "retention",
        h: "Data Storage and Retention",
        p: "Moments, ratings, notes, and child profiles are stored on your device. We do not store those moments or profiles on our servers. If you delete the app, that on-device information is removed with it. The exception is anonymous insights you choose to send: the counts and the optional rating are kept, and free text is deleted after 90 days.",
      },
      {
        id: "insights",
        h: "Weekly digest and anonymous insights",
        p: (
          <>
            <p>
              The daily or weekly digest is built on your device from moments already stored there, separately for each
              child. It is off unless you turn it on. Building or reading the digest does not send those moments to us.
            </p>
            <p className="mt-2">
              Sharing anonymous insights is a separate choice, and it is also off by default. Nothing is sent unless you
              turn sharing on and then confirm one send, after a preview of exactly what will leave the device. Turning
              either option off does not change the price or the guidance you can use.
            </p>
            <p className="mt-2">
              If you send a summary, it can include counts of how moments went (helped a lot, helped, about the same, got
              worse, or not rated) grouped by a fixed list of situation types; counts of which guidance techniques
              appeared in moments that helped or did not; an optional rating from 1 to 5 of how much Kidsit helped that
              week; optional free text you write, up to 500 characters; the app language; whether the device is iOS or
              Android; and the app version at major.minor only. A daily digest is still stored as an ISO week (for
              example 2026-W44), not the exact day. In the digest wording on the device, “about the same” is counted with
              moments that did not help. The anonymous counts keep the original rating, including “about the same”, and
              do not fold it into another number before it is stored.
            </p>
            <p className="mt-2">
              We do not receive children&apos;s names, stories, AI replies, notes, ages, birth dates, gender, diagnoses,
              how many children you have, or any user, device, install, or RevenueCat identifier. The row is stored
              under a random id. The data is not linked to you, and your IP address is not stored in this database.
            </p>
            <p className="mt-2">
              Before sending, the app removes names of children and siblings saved on the device, email addresses, phone
              numbers, web addresses, 9-digit ID numbers, and full dates from the free text, and shows you the cleaned
              version. The server removes emails, phone numbers, web addresses, 9-digit ID numbers, and full dates again
              before writing. Do not write names, places, contact details, or medical details. The text is stored as it
              remains after that cleaning.
            </p>
            <p className="mt-2">
              Free text is deleted automatically after 90 days. The counts may be kept longer. Because the send is
              anonymous, we cannot find or delete one specific submission. To remove a piece of free text that is still
              inside those 90 days, email us and quote it.
            </p>
            <p className="mt-2">
              Submissions are stored in Neon Postgres through Vercel, and the endpoint runs on Vercel. Vercel request
              logs include IP addresses for the plan&apos;s retention period. We do not write the request body or the IP
              address into our database, and we do not use those logs to identify you.
            </p>
            <p className="mt-2">
              The purpose is to improve Kidsit. You can turn sharing off at any time in the app&apos;s settings, and the
              send button then disappears.
            </p>
          </>
        ),
      },
      {
        id: "cookies",
        h: "Cookies and local storage",
        p: (
          <>
            <p>
              We use essential first-party storage so the site works (your language choice and accessibility-menu
              preferences).
              {" "}We also keep how you arrived on this visit (the source, such as a search engine, an AI chat or an ad, its campaign parameters, any ad click ID, and the landing page) in session storage only, which is cleared when you close the tab, and add the source and campaign to the App Store and Google Play links, to measure which channels lead to app downloads.{" "}
              With your permission we also load Google Analytics 4 to understand how the site is used.
              After you accept, Google&apos;s tags may also send a conversion measurement ping when you click an App
              Store or Google Play button (used to attribute store visits from this site). Analytics and those pings do
              not receive anything you enter in the app. Google tags do not load, and non-essential cookies are not set,
              until you accept.
            </p>
            <p className="mt-2">
              Meta Pixel. With the same permission we also load the Meta Pixel from Meta Platforms (Facebook) to measure
              how well our ads work and to count site visits. It loads only after you allow analytics cookies in the
              banner, and you can withdraw that any time under “Cookie settings”. When it runs, Meta may receive cookies
              such as <code>_fbp</code> and <code>_fbc</code>, browser and device information, the pages you visit on this
              site, and your IP address. It may also send automatic click events when you click buttons on the site
              (SubscribedButtonClick). Through Meta&apos;s automatic matching it may also receive hashed identifiers. It does not receive
              anything you enter in the app. Meta&apos;s handling of this data is described in its{" "}
              <a className="text-grape underline underline-offset-2" href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">privacy policy</a>.
            </p>
            <div
              className="mt-4 max-w-full overflow-x-auto rounded-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-grape"
              tabIndex={0}
              role="region"
              aria-label="Cookie table"
            >
            <table role="table" className="cookie-table w-full border-collapse text-sm sm:min-w-[36rem]">
              <thead role="rowgroup">
                <tr role="row" className="border-b-2 border-ink text-start">
                  <th role="columnheader" scope="col" className="py-2 pe-3">Name</th>
                  <th role="columnheader" scope="col" className="py-2 pe-3">Type</th>
                  <th role="columnheader" scope="col" className="py-2 pe-3">Purpose</th>
                  <th role="columnheader" scope="col" className="py-2 pe-3">Duration</th>
                  <th role="columnheader" scope="col" className="py-2">Category</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="Name" className="py-2 pe-3"><code>kidsit-consent</code></td>
                  <td role="cell" data-label="Type" className="py-2 pe-3">localStorage</td>
                  <td role="cell" data-label="Purpose" className="py-2 pe-3">Remembers your cookie choice (version and date)</td>
                  <td role="cell" data-label="Duration" className="py-2 pe-3">12 months</td>
                  <td role="cell" data-label="Category" className="py-2">Essential</td>
                </tr>
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="Name" className="py-2 pe-3"><code>NEXT_LOCALE</code></td>
                  <td role="cell" data-label="Type" className="py-2 pe-3">Cookie</td>
                  <td role="cell" data-label="Purpose" className="py-2 pe-3">Remembers the language you chose (Hebrew or English)</td>
                  <td role="cell" data-label="Duration" className="py-2 pe-3">1 year</td>
                  <td role="cell" data-label="Category" className="py-2">Essential</td>
                </tr>
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="Name" className="py-2 pe-3"><code>Localize-NagishLi-A11y-Plugin-Settings-v3-Beta</code></td>
                  <td role="cell" data-label="Type" className="py-2 pe-3">localStorage</td>
                  <td role="cell" data-label="Purpose" className="py-2 pe-3">Accessibility-menu preferences on your device only</td>
                  <td role="cell" data-label="Duration" className="py-2 pe-3">Until reset or you clear site data</td>
                  <td role="cell" data-label="Category" className="py-2">Essential</td>
                </tr>
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="Name" className="py-2 pe-3"><code>_ga, _ga_*</code></td>
                  <td role="cell" data-label="Type" className="py-2 pe-3">Cookie (Google)</td>
                  <td role="cell" data-label="Purpose" className="py-2 pe-3">Google Analytics 4 statistics, only if you accept analytics</td>
                  <td role="cell" data-label="Duration" className="py-2 pe-3">Up to 2 years (Google)</td>
                  <td role="cell" data-label="Category" className="py-2">Analytics</td>
                </tr>
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="Name" className="py-2 pe-3"><code>pagead2…/measurement/conversion</code></td>
                  <td role="cell" data-label="Type" className="py-2 pe-3">Request (Google)</td>
                  <td role="cell" data-label="Purpose" className="py-2 pe-3">Store-click conversion measurement after you accept; attributes App Store / Play visits from this site</td>
                  <td role="cell" data-label="Duration" className="py-2 pe-3">Session (no extra first-party cookie of ours)</td>
                  <td role="cell" data-label="Category" className="py-2">Analytics</td>
                </tr>
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="Name" className="py-2 pe-3"><code>_fbp</code></td>
                  <td role="cell" data-label="Type" className="py-2 pe-3">Cookie (Meta)</td>
                  <td role="cell" data-label="Purpose" className="py-2 pe-3">Meta Pixel: measures our ads and site visits, only if you accept analytics</td>
                  <td role="cell" data-label="Duration" className="py-2 pe-3">90 days</td>
                  <td role="cell" data-label="Category" className="py-2">Analytics</td>
                </tr>
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="Name" className="py-2 pe-3"><code>_fbc</code></td>
                  <td role="cell" data-label="Type" className="py-2 pe-3">Cookie (Meta)</td>
                  <td role="cell" data-label="Purpose" className="py-2 pe-3">Meta Pixel: set when you arrive from a link on Facebook or Instagram (holds the click ID), only if you accept analytics</td>
                  <td role="cell" data-label="Duration" className="py-2 pe-3">90 days</td>
                  <td role="cell" data-label="Category" className="py-2">Analytics</td>
                </tr>
              </tbody>
            </table>
            </div>
            <p className="mt-4">
              When you first visit we ask you to choose: “Accept all”, “Reject non-essential”, or pick by category under
              “Settings”. We store your choice with its date and ask again after 12 months or if this policy changes.
              You can change or withdraw consent any time with the “Cookie settings” link in the footer of every page.
            </p>
          </>
        ),
      },
      {
        id: "payments",
        h: "Subscriptions and payments",
        p: "Premium subscriptions are sold and billed by Apple (App Store) or Google (Google Play). We never see your card details. Manage or cancel a subscription from your App Store or Google Play subscriptions.",
      },
      {
        id: "children",
        h: "Children's information",
        p: "Kidsit AI is for parents and guardians aged 18 or over, not for children. Any information about a child is entered by their parent or guardian and is handled as described above. The digest is calculated on the device for each child and is not sent unless you turn on sharing and confirm a send. Anonymous insights are not meant to include a child's name or other identifiers.",
      },
      {
        id: "delete",
        h: "How to delete your data",
        p: <>Data stored on your device is removed when you delete the app, or when you use Clear all data in the app. Anonymous insights are not linked to you, so we cannot find one specific submission to delete it. Free text from those submissions is deleted automatically after 90 days. To ask us to remove a piece of free text sooner, or to ask about access, correction, or deletion of anything else, email {mail}.</>,
      },
      {
        id: "rights",
        h: "Your Rights",
        p: "Under the Israeli Privacy Protection Law and the GDPR, you have the right to access, correct, or delete your data. On-device data is under your control in the app. Anonymous insights are not linked to an identity, so we cannot look up a specific send; free text is deleted after 90 days. Contact us using the address below to exercise these rights.",
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
    updated: "9 בנובמבר 2026",
    intro: `Kidsit AI‏ ("האפליקציה") מחויבת להגנה על פרטיותכם ועל פרטיות ילדיכם. מדיניות זו מסבירה כיצד אנו אוספים מידע, משתמשים בו ומגנים עליו.`,
    sections: [
      {
        id: "collect",
        h: "המידע שאנו אוספים",
        p: "האפליקציה אוספת מידע שאתם מוסרים לה ישירות: שמות הילדים, גילם, מאפייניהם ותיאורים של סיטואציות, את הדירוג שלכם לכל רגע (הורע, פחות או יותר אותו דבר, עזר, או עזר מאוד), והערה אם כתבתם אחת. מידע זה נשמר במכשיר שלכם. אם תבחרו בנפרד לשלוח תובנות אנונימיות, נקבל רק את הסיכום המתואר בסעיף „סיכום שבועי ותובנות אנונימיות”.",
      },
      {
        id: "voice",
        h: "הקלטות קוליות ותמלול",
        p: "כאשר אתם משתמשים במיקרופון, הקול שלכם נשלח ל-Whisper של OpenAI‏ (whisper-1) ומתומלל לטקסט באופן זמני, כדי שהאפליקציה תוכל להפיק הדרכה. איננו שומרים את ההקלטות שלכם. שום דבר שאתם אומרים אינו משמש לאימון מודלים.",
      },
      {
        id: "use",
        h: "כיצד אנו משתמשים במידע",
        p: "המידע השמור במכשיר משמש למתן הדרכת הורות מותאמת אישית, ואם תפעילו זאת, גם לסיכום שמחושב על המכשיר. בקשת הדרכה נשלחת לפונקציות שלנו ב-Netlify. הבקשה כוללת רק את הילד שעליו שאלתם: את טקסט הסיפור, את ההקשר שבחרתם (מיקום, מצב הרוח שלכם, מי עוד היה שם, ועד כמה זה דחוף), את הפרופיל של הילד הזה (שם, תאריך לידה, מגדר, תשובות היכרות, הערות, והאם תינוק חדש הצטרף לאחרונה למשפחה, בלי שם התינוק), ואת שמונת הרגעים האחרונים של הילד הזה (הסיפור של כל רגע, תקציר קצר של ההדרכה הקודמת וכותרות העצות, הדירוג שלכם, ואם נשמרו, מתי ואיפה זה קרה ומה היה מצב הרוח שלכם). הבקשה כוללת גם מזהה RevenueCat, כדי שהפונקציה תוכל לבדוק את המנוי. שמות, פרופילים והיסטוריה של ילדים אחרים אינם נשלחים. אם גרסה ישנה של האפליקציה עדיין כוללת אותם, הפונקציה משאירה אותם מחוץ לפרומפט. הערת הרגע נשמרת במכשיר ואינה נכללת בבקשה. מודל gpt-4o-mini של OpenAI מקבל את הסיפור, את ההקשר, את פרופיל הילד הזה, ועד חמישה מאותם רגעים אחרונים. מזהה RevenueCat אינו חלק מהטקסט שנשלח למודל. איננו שומרים את הפרומפטים האלה.",
      },
      {
        id: "sharing",
        h: "שיתוף מידע עם צדדים שלישיים",
        p: (
          <>
            <p>איננו מוכרים מידע אישי. איננו מציגים פרסומות באפליקציה או באתר. אנחנו מפרסמים את Kidsit בפלטפורמות של Meta, ובהסכמתכם מודדים את הפרסומות האלה בעזרת הפיקסל. הספקים שלהלן תואמים את מה שהאפליקציה והאתר באמת משתמשים בו:</p>
            <ul className="mt-3 list-disc space-y-2 ps-5">
              <li>OpenAI: ‏gpt-4o-mini כותב את ההדרכה, ו-Whisper‏ (whisper-1) מתמלל קול, כמתואר לעיל. מדיניות הפרטיות של OpenAI חלה על העיבוד הזה.</li>
              <li>Netlify: מארח את פונקציות ההדרכה והתמלול. הבקשות האלה עוברות דרך Netlify. בלוגים של Netlify עשויה להופיע כתובת IP. תובנות אנונימיות אינן נשלחות ל-Netlify, ואיננו מעתיקים את כתובת ה-IP הזו למסד התובנות.</li>
              <li>RevenueCat: בודק אם מנוי פעיל. האפליקציה שולחת ל-RevenueCat מזהה משתמש של האפליקציה, ופונקציית Netlify יכולה לשלוח את אותו מזהה כשהיא בודקת זכאות. Apple או Google מחייבות אתכם. איננו רואים את מספר כרטיס האשראי.</li>
              <li>Insert Affiliate: אם פתחתם את האפליקציה מקישור שותפים, מזהה שותף נשמר אצל המנוי ב-RevenueCat. הוא אינו נשלח עם תובנות אנונימיות.</li>
              <li>Vercel: מארח את האתר הזה (kidsit.ai) ואת נקודת הקצה של התובנות האנונימיות. בלוגי הבקשות של Vercel מופיעות כתובות IP, למשך השמירה של התוכנית. איננו מעתיקים את כתובת ה-IP או את גוף הבקשה למסד התובנות שלנו.</li>
              <li>Neon: ‏Postgres, המחובר לפרויקט Vercel שלנו, שומר שליחות של תובנות אנונימיות שאתם בוחרים לשלוח. ראו „סיכום שבועי ותובנות אנונימיות”.</li>
              <li>Google: ‏Google Analytics 4 ומדידת לחיצה על חנות באתר הזה בלבד, אחרי שאתם מאשרים עוגיות. הם אינם מקבלים את מה שאתם מזינים באפליקציה. הפירוט נמצא בסעיף „עוגיות ואחסון מקומי”.</li>
              <li>Meta Platforms: הפיקסל של Meta באתר הזה בלבד, אחרי שאתם מאשרים עוגיות סטטיסטיקה, כדי למדוד את הפרסום שלנו וביקורים באתר. הוא אינו מקבל את מה שאתם מזינים באפליקציה. הפירוט נמצא בסעיף „עוגיות ואחסון מקומי”.</li>
            </ul>
          </>
        ),
      },
      {
        id: "retention",
        h: "אחסון ושמירת מידע",
        p: "הרגעים, הדירוגים, ההערות ופרופילי הילדים נשמרים במכשיר שלכם. איננו שומרים את הרגעים או את הפרופילים האלה בשרתים שלנו. מחיקת האפליקציה מוחקת את המידע הזה יחד איתה. החריג הוא תובנות אנונימיות שאתם בוחרים לשלוח: הספירות והדירוג האופציונלי נשמרים, וטקסט חופשי נמחק אחרי 90 יום.",
      },
      {
        id: "insights",
        h: "סיכום שבועי ותובנות אנונימיות",
        p: (
          <>
            <p>
              הסיכום היומי או השבועי נבנה על המכשיר, מתוך רגעים שכבר שמורים שם, ובנפרד לכל ילד. הוא כבוי אלא אם תפעילו
              אותו. בניית הסיכום או קריאתו אינן שולחות אלינו את הרגעים.
            </p>
            <p className="mt-2">
              שיתוף תובנות אנונימיות הוא בחירה נפרדת, וגם הוא כבוי כברירת מחדל. שום דבר לא נשלח אלא אם תפעילו את השיתוף
              ואז תאשרו שליחה מסוימת, אחרי תצוגה מקדימה של בדיוק מה שיוצא מהמכשיר. כיבוי אחת מהאפשרויות לא משנה את המחיר
              ולא את ההדרכה שאפשר לקבל.
            </p>
            <p className="mt-2">
              אם תשלחו סיכום, הוא יכול לכלול ספירות של איך הסתיימו רגעים (עזר מאוד, עזר, פחות או יותר אותו דבר, הורע, או
              בלי דירוג) לפי רשימה קבועה של סוגי סיטואציות; ספירות של טכניקות הדרכה שהופיעו ברגעים שעזרו או שלא עזרו;
              דירוג אופציונלי מ־1 עד 5 על כמה Kidsit עזרה באותו שבוע; טקסט חופשי אופציונלי שאתם כותבים, עד 500 תווים; שפת
              האפליקציה; אם המכשיר הוא iOS או Android; וגרסת האפליקציה ברמת major.minor בלבד. גם סיכום יומי נשמר לפי שבוע
              ISO (למשל 2026-W44), בלי התאריך המדויק. בניסוח הסיכום על המכשיר, „פחות או יותר אותו דבר” נספר יחד עם רגעים
              שלא עזרו. הספירות האנונימיות שומרות את הדירוג המקורי, כולל „פחות או יותר אותו דבר”, ואינן מאחדות אותו עם
              דירוג אחר לפני השמירה.
            </p>
            <p className="mt-2">
              איננו מקבלים שמות של ילדים, סיפורים, תשובות של הבינה המלאכותית, הערות, גילאים, תאריכי לידה, מגדר, אבחנות,
              מספר ילדים, או מזהה משתמש, מכשיר, התקנה או RevenueCat. הרשומה נשמרת תחת מזהה אקראי. הנתונים אינם מקושרים
              אליכם, וכתובת ה-IP אינה נשמרת במסד הזה.
            </p>
            <p className="mt-2">
              לפני השליחה האפליקציה מסירה מהטקסט החופשי שמות של ילדים ואחים השמורים במכשיר, כתובות דוא״ל, מספרי טלפון,
              כתובות אתר, מספרי זהות בני 9 ספרות ותאריכים מלאים, ומראה לכם את הגרסה הנקייה. השרת מסיר שוב דוא״ל, טלפון,
              כתובות אתר, מספרי זהות ותאריכים מלאים לפני הכתיבה. אל תכתבו שמות, מקומות, פרטי קשר או פרטים רפואיים. הטקסט
              נשמר כפי שנשאר אחרי הניקוי.
            </p>
            <p className="mt-2">
              הטקסט החופשי נמחק אוטומטית אחרי 90 יום. הספירות עשויות להישמר זמן רב יותר. מכיוון שהשליחה אנונימית, לא נוכל
              לאתר או למחוק שליחה מסוימת. כדי להסיר טקסט שעודו בתוך 90 הימים, כתבו אלינו וצטטו אותו.
            </p>
            <p className="mt-2">
              השליחות נשמרות ב-Neon Postgres דרך Vercel, והנקודת קצה רצה על Vercel. בלוגי הבקשות של Vercel מופיעות
              כתובות IP, לפי משך השמירה של התוכנית. איננו כותבים את גוף הבקשה או את כתובת ה-IP למסד שלנו, ואיננו משתמשים
              בלוגים האלה כדי לזהות אתכם.
            </p>
            <p className="mt-2">
              המטרה היא לשפר את Kidsit. אפשר לכבות את השיתוף בכל עת בהגדרות האפליקציה, ואז כפתור השליחה נעלם.
            </p>
          </>
        ),
      },
      {
        id: "cookies",
        h: "עוגיות ואחסון מקומי",
        p: (
          <>
            <p>
              אנו משתמשים באחסון חיוני מצד ראשון כדי שהאתר יעבוד (בחירת השפה והעדפות תפריט הנגישות).
              {" "}אנו שומרים גם איך הגעתם לאתר בביקור הזה (המקור, למשל מנוע חיפוש, צ׳אט AI או מודעה, פרמטרי הקמפיין, מזהה הקליק של המודעה אם יש, ועמוד הנחיתה) באחסון הסשן בלבד, שנמחק כשסוגרים את הלשונית, ומוסיפים את המקור והקמפיין לקישורים ל-App Store ול-Google Play, כדי למדוד אילו ערוצים מביאים הורדות של האפליקציה.{" "}
              בהסכמתכם נטען גם
              Google Analytics 4 כדי להבין איך משתמשים באתר. לאחר האישור, תגי Google עשויים גם לשלוח מדידת המרה (conversion)
              כשלוחצים על כפתור App Store או Google Play (כדי לייחס ביקורים בחנויות מהאתר). הניתוח והמדידות האלה אינם מקבלים
              דבר ממה שאתם מזינים באפליקציה. תגי Google לא נטענים, ועוגיות שאינן חיוניות לא נשמרות, עד שתאשרו.
            </p>
            <p className="mt-2">
              הפיקסל של Meta. באותה הסכמה אנו טוענים גם את הפיקסל של Meta מבית Meta Platforms (פייסבוק), כדי למדוד את יעילות
              הפרסום שלנו ולספור ביקורים באתר. הוא נטען רק אחרי שאישרתם עוגיות סטטיסטיקה בבאנר, ואפשר לבטל זאת בכל עת דרך
              „הגדרות עוגיות”. כשהוא פועל, Meta עשויה לקבל עוגיות כמו <code>_fbp</code> ו-<code>_fbc</code>, מידע על הדפדפן
              והמכשיר, העמודים שבהם ביקרתם באתר, וכתובת ה-IP שלכם. הוא עשוי גם לשלוח אירועי לחיצה אוטומטיים כשלוחצים על
              כפתורים באתר (SubscribedButtonClick). באמצעות ההתאמה האוטומטית (automatic matching) של Meta היא עשויה לקבל גם
              מזהים מגובבים (hashed). הוא אינו מקבל דבר ממה שאתם מזינים באפליקציה. הטיפול של Meta במידע הזה מתואר{" "}
              <a className="text-grape underline underline-offset-2" href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">במדיניות הפרטיות שלה</a>.
            </p>
            <div
              className="mt-4 max-w-full overflow-x-auto rounded-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-grape"
              tabIndex={0}
              role="region"
              aria-label="טבלת עוגיות"
            >
            <table role="table" className="cookie-table w-full border-collapse text-sm sm:min-w-[36rem]">
              <thead role="rowgroup">
                <tr role="row" className="border-b-2 border-ink text-start">
                  <th role="columnheader" scope="col" className="py-2 pe-3">שם</th>
                  <th role="columnheader" scope="col" className="py-2 pe-3">סוג</th>
                  <th role="columnheader" scope="col" className="py-2 pe-3">מטרה</th>
                  <th role="columnheader" scope="col" className="py-2 pe-3">משך</th>
                  <th role="columnheader" scope="col" className="py-2">קטגוריה</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="שם" className="py-2 pe-3"><code>kidsit-consent</code></td>
                  <td role="cell" data-label="סוג" className="py-2 pe-3">localStorage</td>
                  <td role="cell" data-label="מטרה" className="py-2 pe-3">שומר את בחירת העוגיות שלכם (גרסה ותאריך)</td>
                  <td role="cell" data-label="משך" className="py-2 pe-3">12 חודשים</td>
                  <td role="cell" data-label="קטגוריה" className="py-2">חיוני</td>
                </tr>
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="שם" className="py-2 pe-3"><code>NEXT_LOCALE</code></td>
                  <td role="cell" data-label="סוג" className="py-2 pe-3">Cookie</td>
                  <td role="cell" data-label="מטרה" className="py-2 pe-3">שומר את השפה שבחרתם (עברית או אנגלית)</td>
                  <td role="cell" data-label="משך" className="py-2 pe-3">שנה</td>
                  <td role="cell" data-label="קטגוריה" className="py-2">חיוני</td>
                </tr>
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="שם" className="py-2 pe-3"><code>Localize-NagishLi-A11y-Plugin-Settings-v3-Beta</code></td>
                  <td role="cell" data-label="סוג" className="py-2 pe-3">localStorage</td>
                  <td role="cell" data-label="מטרה" className="py-2 pe-3">העדפות תפריט הנגישות במכשיר שלכם בלבד</td>
                  <td role="cell" data-label="משך" className="py-2 pe-3">עד איפוס או ניקוי נתוני האתר</td>
                  <td role="cell" data-label="קטגוריה" className="py-2">חיוני</td>
                </tr>
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="שם" className="py-2 pe-3"><code>_ga, _ga_*</code></td>
                  <td role="cell" data-label="סוג" className="py-2 pe-3">Cookie (Google)</td>
                  <td role="cell" data-label="מטרה" className="py-2 pe-3">סטטיסטיקות Google Analytics 4, רק אם אישרתם ניתוח</td>
                  <td role="cell" data-label="משך" className="py-2 pe-3">עד שנתיים (Google)</td>
                  <td role="cell" data-label="קטגוריה" className="py-2">סטטיסטיקה</td>
                </tr>
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="שם" className="py-2 pe-3"><code>pagead2…/measurement/conversion</code></td>
                  <td role="cell" data-label="סוג" className="py-2 pe-3">בקשה (Google)</td>
                  <td role="cell" data-label="מטרה" className="py-2 pe-3">מדידת המרה בלחיצה על חנות האפליקציות לאחר אישור; מייחסת ביקורים ב-App Store / Play מהאתר</td>
                  <td role="cell" data-label="משך" className="py-2 pe-3">למשך הסשן (בלי עוגייה נוספת שלנו)</td>
                  <td role="cell" data-label="קטגוריה" className="py-2">סטטיסטיקה</td>
                </tr>
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="שם" className="py-2 pe-3"><code>_fbp</code></td>
                  <td role="cell" data-label="סוג" className="py-2 pe-3">Cookie (Meta)</td>
                  <td role="cell" data-label="מטרה" className="py-2 pe-3">הפיקסל של Meta: מדידת הפרסום שלנו וביקורים באתר, רק אם אישרתם סטטיסטיקה</td>
                  <td role="cell" data-label="משך" className="py-2 pe-3">90 יום</td>
                  <td role="cell" data-label="קטגוריה" className="py-2">סטטיסטיקה</td>
                </tr>
                <tr role="row" className="border-b border-ink/20 align-top">
                  <td role="cell" data-label="שם" className="py-2 pe-3"><code>_fbc</code></td>
                  <td role="cell" data-label="סוג" className="py-2 pe-3">Cookie (Meta)</td>
                  <td role="cell" data-label="מטרה" className="py-2 pe-3">הפיקסל של Meta: נשמרת כשמגיעים מקישור בפייסבוק או באינסטגרם (מכילה את מזהה הלחיצה), רק אם אישרתם סטטיסטיקה</td>
                  <td role="cell" data-label="משך" className="py-2 pe-3">90 יום</td>
                  <td role="cell" data-label="קטגוריה" className="py-2">סטטיסטיקה</td>
                </tr>
              </tbody>
            </table>
            </div>
            <p className="mt-4">
              בביקור הראשון נבקש מכם לבחור: „אישור הכול”, „דחיית הלא־חיוניות”, או בחירה לפי קטגוריה ב„הגדרות”. נשמור את
              הבחירה עם התאריך ונשאל שוב אחרי 12 חודשים או אם מדיניות זו תשתנה. אפשר לשנות או לבטל הסכמה בכל עת דרך קישור
              „הגדרות עוגיות” בתחתית כל עמוד.
            </p>
          </>
        ),
      },
      {
        id: "payments",
        h: "מנויים ותשלומים",
        p: "מנויי פרימיום נמכרים ומחויבים על ידי Apple ‏(App Store) או Google ‏(Google Play). איננו רואים לעולם את פרטי כרטיס האשראי שלכם. ניהול מנוי או ביטולו נעשים דרך המנויים שלכם ב-App Store או ב-Google Play.",
      },
      {
        id: "children",
        h: "מידע על ילדים",
        p: "Kidsit AI מיועדת להורים ולאפוטרופסים בני 18 ומעלה, ולא לילדים. כל מידע על ילד מוזן על ידי ההורה או האפוטרופוס שלו, והטיפול בו נעשה כמתואר לעיל. הסיכום מחושב על המכשיר לכל ילד בנפרד, ואינו נשלח אלא אם תפעילו שיתוף ותאשרו שליחה. תובנות אנונימיות אינן אמורות לכלול שם של ילד או מזהה אחר.",
      },
      {
        id: "delete",
        h: "כיצד למחוק את המידע שלכם",
        p: <>המידע השמור במכשיר שלכם נמחק עם מחיקת האפליקציה, או כשאתם משתמשים בניקוי כל הנתונים באפליקציה. תובנות אנונימיות אינן מקושרות אליכם, ולכן לא נוכל לאתר שליחה מסוימת כדי למחוק אותה. טקסט חופשי מהשליחות האלה נמחק אוטומטית אחרי 90 יום. כדי לבקש שנמחק טקסט חופשי מוקדם יותר, או לשאול על עיון, תיקון או מחיקה של כל דבר אחר, כתבו אלינו לכתובת {mail}.</>,
      },
      {
        id: "rights",
        h: "הזכויות שלכם",
        p: "בהתאם לחוק הגנת הפרטיות הישראלי ולתקנה הכללית להגנה על מידע של האיחוד האירופי (GDPR), עומדת לכם הזכות לעיין במידע שלכם, לתקנו או למחוק אותו. המידע שבמכשיר נמצא בשליטתכם באפליקציה. תובנות אנונימיות אינן מקושרות לזהות, ולכן לא נוכל לאתר שליחה מסוימת; טקסט חופשי נמחק אחרי 90 יום. למימוש הזכויות האלה, פנו אלינו בכתובת המופיעה להלן.",
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
