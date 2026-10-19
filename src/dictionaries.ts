export const LANGS = ["en", "he"] as const;
export type Lang = (typeof LANGS)[number];

// The one support address used everywhere on the site (footer, FAQ, legal pages, /support).
export const SUPPORT_EMAIL = "omer+support@kidsit.ai";
// Accessibility contact (accessibility statement only). Kept separate from support on purpose.
export const ACCESSIBILITY_EMAIL = "omer+privacy@kidsit.ai";

// TODO(Gal): App Store Connect provider token ("pt"), from App Store Connect → App Analytics →
// Campaigns → Generate a campaign link. Paste the numeric token here as a string, e.g. "123456".
// While it's empty, `pt` is left out of the App Store links (App Analytics won't attribute ct= without it).
export const APP_STORE_PROVIDER_TOKEN = "";

// Every placement is prefixed with the page language (he_site_hero / en_site_hero) so Hebrew and
// English visitors can be told apart in App Store Connect (ct) and Play Console (utm_content).
const tag = (lang: Lang, placement: string) => `${lang}_${placement}`;

// No /us/ in the Apple URL: Apple redirects to the visitor's storefront.
export const storeUrl = {
  apple: (placement: string, lang: Lang) => {
    const q = new URLSearchParams({ mt: "8", ct: tag(lang, placement) });
    if (APP_STORE_PROVIDER_TOKEN) q.set("pt", APP_STORE_PROVIDER_TOKEN);
    return `https://apps.apple.com/app/id6769443099?${q}`;
  },
  // referrer= carries the campaign into Play Console → Acquisition reports
  play: (placement: string, lang: Lang) =>
    `https://play.google.com/store/apps/details?id=ai.kidsit.app&referrer=${encodeURIComponent(
      `utm_source=kidsit_site&utm_medium=web&utm_campaign=site_cta_${lang}&utm_content=${tag(lang, placement)}`,
    )}`,
};

export type FaqItem = { q: string; a: string; link?: { label: string; href: string } };

const en = {
  dir: "ltr" as "ltr" | "rtl",
  meta: {
    title: "Kidsit AI | Calm guidance for hard parenting moments",
    description:
      "Whisper what just happened with your child. Get warm, science-backed guidance in about 10 seconds, without judgment and without lectures.",
  },
  nav: {
    links: [
      { label: "Features", href: "#features" },
      { label: "See it work", href: "#demo" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
    cta: "Try it free",
    switchLabel: "עברית",
    switchHref: "/he",
    switchLang: "he",
    label: "Main",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  hero: {
    badge: "AI parenting copilot for iPhone and Android",
    h1a: "Calm help for the",
    h1Scribbled: "hard parenting moments.",
    sub: "Hold the mic, say what happened. Get a calm plan in about 10 seconds.",
    ctaApple: "App Store",
    ctaPlay: "Google Play",
    ctaSecondary: "Watch it work",
    chipWhisper: "🎙️ whisper what happened",
    chipTime: "⏱️ ~10 sec to a plan",
    screenshotAlt:
      "Kidsit AI home screen: 'What happened with Tom?' with a press-and-hold microphone button mid-recording",
  },
  features: {
    heading: "Built for the hardest 10 minutes of your day",
    sub: "The kid is on the floor, it's 6 PM, and you can't exactly google it mid-meltdown.",
    cards: [
      {
        emoji: "⚡",
        title: "Instant help, in the moment",
        desc: "Get practical, personalized guidance the moment a challenge arises with your child. Whisper it or type it, even when your hands are full.",
      },
      {
        emoji: "🧠",
        title: "Tailored to your child",
        desc: "Kidsit gets to know your child and adapts its advice. When you mark something \"didn't help,\" the next answer tries a different angle.",
      },
      {
        emoji: "📒",
        title: "Remembers every moment",
        desc: "Past moments for each child feed into the next answer, so guidance fits your child better over time.",
      },
    ],
  },
  showcase: {
    heading: "See a real answer",
    sub: "A 30-second walkthrough: one whispered moment, and what comes back.",
    videoLabel: "30-second demo: a parent describes a hard moment and gets a calm plan",
    alts: [
      "Kidsit AI response screen with structured guidance: what happened, why, and what to try",
      "Kidsit AI history screen showing logged moments for a child",
    ],
    captions: [
      "A kinder second look: not a lecture, not a label",
      "Every moment is remembered next time",
    ],
  },
  social: {
    heading: "Loved by parents",
    stats: [
      { value: "iOS + Android", label: "one app, either phone" },
      { value: "~10 sec", label: "from whisper to plan" },
      { value: "1 kid free", label: "no time limit" },
    ],
    sourceLabel: "App Store review",
    translatedNote: "",
    quotes: [
      {
        quote:
          "It didn't just tell me what to do in the moment, it also helped me understand the bigger picture behind the behavior. Highly recommend to any parent looking for support and effective strategies.",
        name: "OzzyL10",
        role: "Helpful and Thoughtful Parenting Support",
        initials: "O",
      },
      {
        quote:
          "KidSit has become a valuable tool in my parenting journey. The advice is practical, thoughtful, and available exactly when I need it. I love how easy it is to describe a situation and get clear, actionable guidance.",
        name: "Busy single mom1",
        role: "A must have for every parent!",
        initials: "B",
      },
      {
        quote: "Easy to use interface and super useful.",
        name: "jasonetr",
        role: "Brilliant.",
        initials: "J",
      },
    ],
  },
  pricing: {
    heading: "Free for one child. Premium free for 7 days.",
    sub: "Premium starts with a 7-day free trial. Cancel anytime from your App Store or Google Play subscriptions.",
    toggleLabel: "Billing period",
    yearlyNote: "That's $5.00/month, billed yearly after a 7-day free trial.",
    monthlyNote: "Billed monthly after a 7-day free trial.",
    monthly: "Monthly",
    yearly: "Yearly · save 50%",
    perMonth: "/month",
    perYear: "/year",
    storeApple: "App Store",
    storePlay: "Google Play",
    free: {
      name: "Try it",
      desc: "For getting to know the coach.",
      price: "Free",
      cadence: "no time limit",
      features: ["One child profile", "Voice or typed moments", "Full guidance answers"],
    },
    premium: {
      name: "Premium",
      desc: "Everything, for the whole crew.",
      badge: "Most loved",
      features: [
        "7-day free trial",
        "Track every child",
        "Unlimited moments",
        "Memory for each child",
        "Cancel anytime",
      ],
    },
  },
  faq: {
    heading: "The questions every parent asks",
    items: [
      {
        q: "Is this therapy or medical advice?",
        a: "No. Kidsit AI is a reflective parenting companion for everyday moments: tantrums, bedtime standoffs, sibling battles. It does not diagnose or treat, and if something touches your child's safety, development, or mental health, it will tell you plainly to talk to a pediatrician, therapist, or licensed clinician.",
      },
      {
        q: "Where does the advice come from?",
        a: "The guidance is grounded in decades of established child-development research and respected parenting practice: empathy first, advice last. The tone is a calm friend with a developmental-psych background, not a clinical report and not a lecture.",
      },
      {
        q: "What happens to what I whisper?",
        a: "Your voice is transcribed transiently and not retained by us. Moments and child profiles live on your device. No ads, no selling data, and nothing you say is used to train models.",
        link: { label: "Read how voice is handled", href: "/en/privacy#voice" },
      },
      {
        q: "How does the free trial work?",
        a: "You can use Kidsit AI free with one child, no time limit. Premium (track every child, unlimited moments) comes as a monthly or yearly plan, and both start with a 7-day free trial for new subscribers. Cancel anytime. On iPhone: Settings → [your name] → Subscriptions. On Android: Google Play → Profile → Payments & subscriptions → Subscriptions.",
      },
      {
        q: "Is it on Android?",
        a: `Yes. Kidsit AI is available for both iPhone and Android, grab it from the App Store or Google Play. Same app, same coach, either phone. Questions? Write to ${SUPPORT_EMAIL}.`,
      },
    ] as FaqItem[],
  },
  footer: {
    label: "Footer",
    switchLabel: "עברית",
    switchHref: "/he",
    switchLang: "he",
    tagline: "Calm guidance for hard moments. Built by a parent, for parents.",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "See it work", href: "#demo" },
      { label: "FAQ", href: "#faq" },
      { label: "Privacy", href: "/en/privacy" },
      { label: "Terms", href: "/en/terms" },
      { label: "Support", href: "/en/support" },
      { label: "Accessibility", href: "/en/accessibility" },
      { label: "Contact us", href: `mailto:${SUPPORT_EMAIL}` },
    ],
    disclaimer:
      "© 2026 Kidsit.ai. This app is not a substitute for professional, medical, or psychological advice. It is designed to provide parents with smart, sensitive, and practical guidance for dealing with everyday situations in real-time.",
  },
  legal: {
    back: "← Back to ",
    home: "/en",
  },
};

export type Dict = typeof en;

const he: Dict = {
  dir: "rtl",
  meta: {
    title: "Kidsit AI | הדרכה רגועה לרגעים הקשים",
    description:
      "מספרים מה קרה עכשיו עם הילד ומקבלים הדרכה חמה, בהשראת גישות הורות מוכרות, תוך כ-10 שניות. בלי שיפוטיות ובלי הרצאות.",
  },
  nav: {
    links: [
      { label: "תכונות", href: "#features" },
      { label: "איך זה עובד", href: "#demo" },
      { label: "מחירים", href: "#pricing" },
      { label: "שאלות נפוצות", href: "#faq" },
    ],
    cta: "נסו חינם",
    switchLabel: "English",
    switchHref: "/en",
    switchLang: "en",
    label: "ראשי",
    openMenu: "פתיחת תפריט",
    closeMenu: "סגירת תפריט",
  },
  hero: {
    badge: "קופיילוט הורות חכם לאייפון ולאנדרואיד",
    h1a: "עזרה רגועה",
    h1Scribbled: "לרגעים הקשים בהורות.",
    sub: "לוחצים על המיקרופון ומספרים מה קרה. תוך כ-10 שניות מקבלים תוכנית רגועה.",
    ctaApple: "App Store",
    ctaPlay: "Google Play",
    ctaSecondary: "צפו איך זה עובד",
    chipWhisper: "🎙️ מספרים מה קרה",
    chipTime: "⏱️ כ-10 שניות לתוכנית",
    screenshotAlt:
      "מסך הבית של Kidsit AI: \"מה קרה עם נועה?\" (בת שנתיים) עם כפתור מיקרופון להקלטה בלחיצה ממושכת",
  },
  features: {
    heading: "נבנה בשביל 10 הדקות הקשות של היום",
    sub: "הילד על הרצפה, השעה 18:00, ואי אפשר בדיוק לגגל את זה באמצע התקף זעם.",
    cards: [
      {
        emoji: "⚡",
        title: "עזרה מיידית בכל סיטואציה",
        desc: "הדרכה מעשית ומותאמת אישית ברגע שמתעורר אתגר עם הילד. בקול או בהקלדה, גם כשהידיים מלאות.",
      },
      {
        emoji: "🧠",
        title: "מותאם לילד שלכם",
        desc: "Kidsit מכירה את הילד שלכם ומתאימה את העצות בהתאם. סימנתם ש\"לא עזר\"? התשובה הבאה תנסה כיוון אחר.",
      },
      {
        emoji: "📒",
        title: "זוכרת כל רגע",
        desc: "רגעים קודמים של כל ילד משפיעים על התשובה הבאה, כך שהעצות מתאימות לו יותר עם הזמן.",
      },
    ],
  },
  showcase: {
    heading: "ככה נראית תשובה אמיתית",
    sub: "הדגמה של חצי דקה: רגע אחד שסיפרתם, ומה שחוזר.",
    videoLabel: "הדגמה של 30 שניות: הורה מספר על רגע קשה ומקבל תוכנית רגועה",
    alts: [
      "מסך התשובה של Kidsit AI עם הדרכה מסודרת: מה קרה, למה, ומה לנסות",
      "מסך ההיסטוריה של Kidsit AI עם רגעים שנרשמו עבור ילד",
    ],
    captions: [
      "מבט שני, רך יותר: לא הרצאה ולא תווית",
      "כל רגע נזכר בפעם הבאה",
    ],
  },
  social: {
    heading: "הורים ממליצים",
    stats: [
      { value: "iOS + אנדרואיד", label: "אפליקציה אחת, כל טלפון" },
      { value: "כ-10 שניות", label: "מסיפור לתוכנית" },
      { value: "ילד אחד חינם", label: "ללא הגבלת זמן" },
    ],
    sourceLabel: "ביקורת ב-App Store",
    translatedNote: "תורגם מאנגלית",
    quotes: [
      {
        quote:
          "האפליקציה לא רק אמרה לי מה לעשות ברגע עצמו, היא עזרה לי להבין את התמונה הגדולה שמאחורי ההתנהגות. ממליץ בחום לכל הורה שמחפש תמיכה ואסטרטגיות שעובדות.",
        name: "OzzyL10",
        role: "תמיכה הורית מועילה ומתחשבת",
        initials: "O",
      },
      {
        quote:
          "KidSit הפכה לכלי חשוב במסע ההורות שלי. העצות מעשיות, מחושבות וזמינות בדיוק כשאני צריכה אותן. אני אוהבת כמה קל לתאר סיטואציה ולקבל הדרכה ברורה שאפשר ליישם.",
        name: "Busy single mom1",
        role: "חובה לכל הורה!",
        initials: "B",
      },
      {
        quote: "ממשק קל לשימוש ושימושי בטירוף.",
        name: "jasonetr",
        role: "מבריק.",
        initials: "J",
      },
    ],
  },
  pricing: {
    heading: "חינם לילד אחד. פרימיום חינם ל-7 ימים.",
    sub: "פרימיום מתחיל בשבוע ניסיון חינם. אפשר לבטל בכל רגע דרך המנויים ב-App Store או ב-Google Play.",
    toggleLabel: "תקופת חיוב",
    yearlyNote: "זה $5.00 לחודש, בחיוב שנתי אחרי 7 ימי ניסיון חינם.",
    monthlyNote: "חיוב חודשי אחרי 7 ימי ניסיון חינם.",
    monthly: "חודשי",
    yearly: "שנתי · חוסכים 50%",
    perMonth: "לחודש",
    perYear: "לשנה",
    storeApple: "App Store",
    storePlay: "Google Play",
    free: {
      name: "לנסות",
      desc: "בשביל להכיר את המאמן.",
      price: "חינם",
      cadence: "ללא הגבלת זמן",
      features: ["פרופיל לילד אחד", "רגעים בקול או בהקלדה", "תשובות הדרכה מלאות"],
    },
    premium: {
      name: "פרימיום",
      desc: "הכול, לכל החבורה.",
      badge: "הכי אהוב",
      features: [
        "שבוע ניסיון חינם",
        "מעקב אחרי כל הילדים",
        "רגעים ללא הגבלה",
        "זיכרון לכל ילד",
        "ביטול בכל עת",
      ],
    },
  },
  faq: {
    heading: "השאלות שכל הורה שואל",
    items: [
      {
        q: "זה תחליף לטיפול או לייעוץ רפואי?",
        a: "לא. Kidsit AI היא מלווה הורות רפלקטיבית לרגעים היומיומיים, התקפי זעם, מאבקי שינה, ריבים בין אחים. היא לא מאבחנת ולא מטפלת, ואם משהו נוגע לבטיחות, להתפתחות או לבריאות הנפשית של הילד, היא תגיד לכם בפירוש לפנות לרופא ילדים, למטפל או לאיש מקצוע מוסמך.",
      },
      {
        q: "מאיפה מגיעות העצות?",
        a: "ההדרכה מבוססת על עשרות שנים של מחקר בהתפתחות הילד ועל גישות הורות מוכרות: קודם אמפתיה, אחר כך עצה. הטון הוא של חבר רגוע עם רקע בפסיכולוגיה התפתחותית, לא דוח קליני ולא הרצאה.",
      },
      {
        q: "מה קורה עם מה שאני מספר?",
        a: "ההקלטה מתומללת באופן זמני ולא נשמרת אצלנו. הרגעים ופרופילי הילדים נשמרים במכשיר שלכם. בלי פרסומות, בלי מכירת מידע, ושום דבר שאתם אומרים לא משמש לאימון מודלים.",
        link: { label: "איך מטפלים בקול", href: "/he/privacy#voice" },
      },
      {
        q: "איך עובד הניסיון החינמי?",
        a: "אפשר להשתמש ב-Kidsit AI חינם עם ילד אחד, ללא הגבלת זמן. פרימיום (מעקב אחרי כל הילדים ורגעים ללא הגבלה) מגיע במנוי חודשי או שנתי, ושניהם מתחילים בשבוע ניסיון חינם למנויים חדשים. ביטול בכל רגע. באייפון: הגדרות ← [השם שלכם] ← מנויים. באנדרואיד: Google Play ← פרופיל ← תשלומים ומנויים ← מנויים.",
      },
      {
        q: "יש גרסה לאנדרואיד?",
        a: `כן. Kidsit AI זמינה גם לאייפון וגם לאנדרואיד, מורידים מה-App Store או מ-Google Play. אותה אפליקציה, אותו מאמן, בכל טלפון. יש שאלות? כתבו לנו: ${SUPPORT_EMAIL}.`,
      },
    ],
  },
  footer: {
    label: "תחתית",
    switchLabel: "English",
    switchHref: "/en",
    switchLang: "en",
    tagline: "הדרכה רגועה לרגעים הקשים. נבנה על ידי הורה, בשביל הורים.",
    links: [
      { label: "תכונות", href: "#features" },
      { label: "מחירים", href: "#pricing" },
      { label: "איך זה עובד", href: "#demo" },
      { label: "שאלות נפוצות", href: "#faq" },
      { label: "פרטיות", href: "/he/privacy" },
      { label: "תנאי שימוש", href: "/he/terms" },
      { label: "תמיכה", href: "/he/support" },
      { label: "הצהרת נגישות", href: "/he/accessibility" },
      { label: "צרו קשר", href: `mailto:${SUPPORT_EMAIL}` },
    ],
    disclaimer:
      "© 2026 Kidsit.ai. האפליקציה אינה תחליף לייעוץ מקצועי, רפואי או פסיכולוגי. היא נועדה להעניק להורים הדרכה חכמה, רגישה ומעשית להתמודדות עם סיטואציות יומיומיות בזמן אמת.",
  },
  legal: {
    back: "→ חזרה ל-",
    home: "/he",
  },
};

export const dictionaries: Record<Lang, Dict> = { en, he };
