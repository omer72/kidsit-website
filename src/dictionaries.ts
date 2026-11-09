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

// Live store listings. Every button and schema URL is built from these two constants.
export const APP_STORE_URL = "https://apps.apple.com/us/app/parent-coach-ai-kidsit/id6769443099";
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=ai.kidsit.app";

// Every placement is prefixed with the page language (he_site_hero / en_site_hero) so Hebrew and
// English visitors can be told apart in App Store Connect (ct) and Play Console (utm_content).
const tag = (lang: Lang, placement: string) => `${lang}_${placement}`;

export const storeUrl = {
  apple: (placement: string, lang: Lang) => {
    const q = new URLSearchParams({ mt: "8", ct: tag(lang, placement) });
    if (APP_STORE_PROVIDER_TOKEN) q.set("pt", APP_STORE_PROVIDER_TOKEN);
    return `${APP_STORE_URL}?${q}`;
  },
  // referrer= carries the campaign into Play Console → Acquisition reports
  play: (placement: string, lang: Lang) =>
    `${PLAY_STORE_URL}&referrer=${encodeURIComponent(
      `utm_source=kidsit_site&utm_medium=web&utm_campaign=site_cta_${lang}&utm_content=${tag(lang, placement)}`,
    )}`,
};

export type FaqItem = { q: string; a: string; link?: { label: string; href: string } };

const en = {
  dir: "ltr" as "ltr" | "rtl",
  stores: {
    appleAlt: "Download on the App Store",
    playAlt: "Get it on Google Play",
  },
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
      { label: "Blog", href: "/en/blog" },
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
    h1a: "Calm help for the",
    h1Scribbled: "hard",
    h1b: "parenting moments.",
    sub: "Hold the mic, say what happened. Get a calm plan in about 10 seconds.",
    ctaApple: "App Store",
    ctaPlay: "Google Play",
    ctaSecondary: "Watch it work",
    chipWhisper: "whisper what happened",
    chipTime: "~10 sec to a plan",
    screenshotAlt:
      "Kidsit AI home screen: ‘What happened with Tom?’ with a press-and-hold microphone button mid-recording",
  },
  features: {
    heading: "Built for the hardest 10 minutes of your day",
    sub: "The kid is on the floor, it’s 6 PM, and you can’t exactly google it mid-meltdown.",
    cards: [
      {
        title: "Instant help, in the moment",
        desc: "Get practical, personalized guidance the moment a challenge arises with your child. Whisper it or type it, even when your hands are full.",
      },
      {
        title: "Tailored to your child",
        desc: "Kidsit gets to know your child and adapts its advice. When you mark something “didn’t help,” the next answer tries a different angle.",
      },
      {
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
  summary: {
    badge: "New in app 1.0.13",
    heading: "A daily or weekly summary, on the device",
    lead: "The summary is built on the device for the open child from moments already stored there, covering either the current week or today, and it does not call a model.",
    detail:
      "It counts each situation by whether it helped, did not help, or has no rating, and adds up to three fixed sentences about what stands out.",
    points: [
      {
        title: "Weekly or daily",
        text: "Settings turns it on and chooses weekly or daily.",
      },
      {
        title: "A local reminder",
        text: "On the phone a local reminder can also be set, and its text is a fixed line with no child's name.",
      },
    ],
    tabsLabel: "Summary screens",
    shots: [
      {
        id: "weekly",
        label: "Weekly",
        caption: "The current week, counted on the device",
        alt: "Kidsit weekly summary for the open child: each situation counted by whether it helped, did not help, or has no rating. Built on the device, with no model call.",
      },
      {
        id: "daily",
        label: "Daily",
        caption: "Today, plus up to three fixed sentences",
        alt: "Kidsit daily summary for the open child: today's situations counted by whether they helped, did not help, or have no rating, plus a fixed sentence about what stands out.",
      },
      {
        id: "settings",
        label: "Settings",
        caption: "Turn it on, then choose weekly or daily",
        alt: "Kidsit settings screen with the summary switched on, and a choice between weekly and daily.",
      },
    ],
    schemaFeature: "On-device daily or weekly summary for the open child, with no model call",
  },
  social: {
    heading: "Loved by parents",
    sourceLabel: "App Store review",
    translatedNote: "",
    quotes: [
      {
        quote:
          "It didn’t just tell me what to do in the moment, it also helped me understand the bigger picture behind the behavior. Highly recommend to any parent looking for support and effective strategies.",
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
    heading: "One child without a subscription. Premium may include a trial when one is offered.",
    sub: "Premium may start with a trial when one is offered. Availability, length, and eligibility can vary — check the current offer in the app. Cancel anytime from your App Store or Google Play subscriptions.",
    toggleLabel: "Billing period",
    yearlyNote: "That’s $5.00/month, billed yearly after any trial that is offered and for which you are eligible.",
    monthlyNote: "Billed monthly after any trial that is offered and for which you are eligible.",
    monthly: "Monthly",
    yearly: "Yearly · save 50%",
    perMonth: "/month",
    perYear: "/year",
    storeApple: "App Store",
    storePlay: "Google Play",
    free: {
      name: "Try it",
      desc: "For getting to know the coach.",
      price: "Start without a subscription",
      cadence: "one child",
      features: ["One child profile", "Voice or typed moments", "New guidance requires an active subscription or trial"],
    },
    premium: {
      name: "Premium",
      desc: "Everything, for the whole crew.",
      badge: "Best value",
      features: [
        "A trial may be offered — check eligibility in the app",
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
        a: "No. Kidsit AI is an AI parent-guidance tool for everyday moments: tantrums, bedtime standoffs, sibling battles. It is not therapy, not medical or psychological advice, and not a replacement for a human parent coach or a licensed professional. It does not diagnose or treat, and if something touches your child's safety, development, or mental health, the app refers you to a pediatrician or a licensed professional.",
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
        q: "What is the daily or weekly summary?",
        a: "In app 1.0.13, Settings turns it on and chooses weekly or daily. The summary is built on the device for the open child from moments already stored there, covering either the current week or today, and it does not call a model. It counts each situation by whether it helped, did not help, or has no rating, and adds up to three fixed sentences about what stands out. On the phone a local reminder can also be set, and its text is a fixed line with no child's name.",
      },
      {
        q: "How does the free trial work?",
        a: "You can start Kidsit AI with one child without a subscription, and no account is required to start. Generating new guidance requires an active subscription or trial. This is not unlimited free guidance, and a free trial is not guaranteed. Premium supports more than one child. A trial may be offered to some new subscribers; availability, length, and eligibility can vary, so check the current offer in the app. If you have a subscription, cancel anytime through your App Store or Google Play subscriptions. On iPhone: Settings → [your name] → Subscriptions. On Android: Google Play → Profile → Payments & subscriptions → Subscriptions.",
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
      { label: "Blog", href: "/en/blog" },
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
    back: "Back to ",
    home: "/en",
  },
};

export type Dict = typeof en;

const he: Dict = {
  dir: "rtl",
  stores: {
    appleAlt: "להורדה ב-App Store",
    playAlt: "כעת ב-Google Play",
  },
  meta: {
    title: "Kidsit AI | אפליקציית הדרכת הורים לרגעים הקשים, בקול",
    description:
      "Kidsit היא אפליקציית הדרכת הורים מבוססת AI לרגע הקשה: מספרים בקול מה קרה ומקבלים תוכנית קצרה. היא לא טיפול ולא תחליף לאיש מקצוע מוסמך.",
  },
  nav: {
    links: [
      { label: "תכונות", href: "#features" },
      { label: "איך זה עובד", href: "#demo" },
      { label: "מחירים", href: "#pricing" },
      { label: "שאלות נפוצות", href: "#faq" },
      { label: "בלוג", href: "/he/blog" },
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
    h1a: "עזרה רגועה לרגעים",
    h1Scribbled: "הקשים",
    h1b: "בהורות.",
    sub: "לוחצים על המיקרופון ומספרים מה קרה. תוך כ-10 שניות מקבלים תוכנית רגועה.",
    ctaApple: "App Store",
    ctaPlay: "Google Play",
    ctaSecondary: "צפו איך זה עובד",
    chipWhisper: "מספרים מה קרה",
    chipTime: "כ-10 שניות לתוכנית",
    screenshotAlt:
      "מסך הבית של Kidsit AI: \"מה קרה עם נועה?\" (בת שנתיים) עם כפתור מיקרופון להקלטה בלחיצה ממושכת",
  },
  features: {
    heading: "נבנה בשביל 10 הדקות הקשות של היום",
    sub: "הילד על הרצפה, השעה 18:00, ואי אפשר בדיוק לגגל את זה באמצע התקף זעם.",
    cards: [
      {
        title: "עזרה מיידית בכל סיטואציה",
        desc: "הדרכה מעשית ומותאמת אישית ברגע שמתעורר אתגר עם הילד. בקול או בהקלדה, גם כשהידיים מלאות.",
      },
      {
        title: "מותאם לילד שלכם",
        desc: "Kidsit מכירה את הילד שלכם ומתאימה את העצות בהתאם. סימנתם ש\"לא עזר\"? התשובה הבאה תנסה כיוון אחר.",
      },
      {
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
  summary: {
    badge: "חדש באפליקציה 1.0.13",
    heading: "סיכום יומי או שבועי, במכשיר",
    lead: "הסיכום נבנה במכשיר עבור הילד הפתוח, מהרגעים שכבר שמורים שם, לשבוע הנוכחי או להיום, בלי קריאה למודל.",
    detail: "הוא סופר כל סוג מצב לפי עזר, לא עזר או בלי דירוג, ומוסיף עד שלושה משפטים קבועים על מה שבולט.",
    points: [
      {
        title: "שבועי או יומי",
        text: "בהגדרות מפעילים אותו ובוחרים שבועי או יומי.",
      },
      {
        title: "תזכורת מקומית",
        text: "באפליקציה אפשר גם לקבוע תזכורת מקומית עם משפט קבוע, בלי שם הילד.",
      },
    ],
    tabsLabel: "מסכי הסיכום",
    shots: [
      {
        id: "weekly",
        label: "שבועי",
        caption: "השבוע הנוכחי, בספירה על המכשיר",
        alt: "מסך הסיכום השבועי של Kidsit עבור הילד הפתוח: כל סוג מצב נספר לפי עזר, לא עזר או בלי דירוג, והסיכום נבנה במכשיר בלי קריאה למודל.",
      },
      {
        id: "daily",
        label: "יומי",
        caption: "היום, ועד שלושה משפטים קבועים",
        alt: "מסך הסיכום היומי של Kidsit עבור הילד הפתוח: ספירה של המצבים מהיום לפי עזר, לא עזר או בלי דירוג, ומשפט קבוע על מה שבולט.",
      },
      {
        id: "settings",
        label: "הגדרות",
        caption: "מפעילים ובוחרים שבועי או יומי",
        alt: "מסך ההגדרות של Kidsit: הסיכום מופעל, ואפשר לבחור בין שבועי ליומי.",
      },
    ],
    schemaFeature: "סיכום יומי או שבועי במכשיר עבור הילד הפתוח, בלי קריאה למודל",
  },
  social: {
    heading: "הורים ממליצים",
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
      badge: "הכי משתלם",
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
        a: "לא. Kidsit היא כלי הדרכת הורים מבוסס AI לרגע עצמו, כמו התקף זעם, מאבק שינה או ריב בין אחים. היא לא טיפול, לא ייעוץ רפואי או פסיכולוגי, ולא תחליף למדריכת הורים או לאיש מקצוע מוסמך. אם משהו נוגע לבטיחות, להתפתחות או לבריאות הנפשית, האפליקציה מפנה לרופא ילדים או לאיש מקצוע מוסמך.",
        link: {
          label: "איזו עזרה מתאימה לכם — הדרכת הורים, טיפול או אפליקציה",
          href: "/he/blog/hadrachat-horim",
        },
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
        q: "מה זה הסיכום היומי או השבועי?",
        a: "באפליקציה 1.0.13 מפעילים את הסיכום בהגדרות ובוחרים שבועי או יומי. הסיכום נבנה במכשיר עבור הילד הפתוח, מהרגעים שכבר שמורים שם, לשבוע הנוכחי או להיום, בלי קריאה למודל. הוא סופר כל סוג מצב לפי עזר, לא עזר או בלי דירוג, ומוסיף עד שלושה משפטים קבועים על מה שבולט. באפליקציה אפשר גם לקבוע תזכורת מקומית עם משפט קבוע, בלי שם הילד.",
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
      { label: "בלוג", href: "/he/blog" },
      { label: "הדרכת הורים", href: "/he/blog/hadrachat-horim" },
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
    back: "חזרה ל-",
    home: "/he",
  },
};

export const dictionaries: Record<Lang, Dict> = { en, he };
