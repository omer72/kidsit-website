export const LANGS = ["en", "he"] as const;
export type Lang = (typeof LANGS)[number];

export const STORE_URLS = {
  apple: "https://apple.co/4a3XNxw",
  play: "https://play.google.com/store/apps/details?id=ai.kidsit.app",
};

const en = {
  dir: "ltr" as "ltr" | "rtl",
  meta: {
    title: "Kidsit AI — calm guidance for hard moments",
    description:
      "Whisper what just happened with your child. Get warm, science-backed guidance in seconds — without judgment, without lectures.",
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
  },
  hero: {
    badge: "Your AI parenting copilot · ★ 5.0 on the App Store",
    h1a: "Smart guidance,",
    h1b: "right",
    h1Scribbled: "when you need it.",
    sub: "Press and hold the mic. Describe what just happened with your kid — even when your hands are full. Ten seconds later: practical, personalized guidance in real time.",
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
        title: "Instant help in situations",
        desc: "Get practical, personalized guidance the moment a challenge arises with your child — whisper it or type it, even when your hands are full.",
      },
      {
        emoji: "🧠",
        title: "Tailored to your child",
        desc: "The system learns your child's characteristics and adapts advice accordingly. When you mark something \"didn't help,\" the next answer tries a different angle.",
      },
      {
        emoji: "🌙",
        title: "End of day report",
        desc: "Get insights on the day's patterns and challenges, plus tips for tomorrow — so the hard moments turn into something you can actually see and plan around.",
      },
    ],
  },
  showcase: {
    heading: "See a real answer",
    sub: "Thirty seconds, one whispered moment, and what comes back.",
    captions: [
      "A kinder second look — not a lecture, not a label",
      "Patterns become visible over time",
    ],
  },
  social: {
    heading: "Loved by parents",
    stats: [
      { value: "5.0★", label: "on the App Store" },
      { value: "~10 sec", label: "from whisper to plan" },
      { value: "1 kid free", label: "no time limit" },
    ],
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
    heading: "Free with one kid. Trial the rest.",
    sub: "Premium starts with a 7-day free trial. Cancel anytime in Settings → Subscriptions.",
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
        "Unlimited children",
        "Patterns & memory over time",
        "End of day reports",
        "Cancel anytime",
      ],
    },
  },
  faq: {
    heading: "The questions every parent asks",
    items: [
      {
        q: "Is this therapy or medical advice?",
        a: "No. Kidsit AI is a reflective parenting companion for everyday moments — tantrums, bedtime standoffs, sibling battles. It does not diagnose or treat, and if something touches your child's safety, development, or mental health, it will tell you plainly to talk to a pediatrician, therapist, or licensed clinician.",
      },
      {
        q: "Where does the advice come from?",
        a: "The guidance is grounded in decades of established child-development research and respected parenting practice: empathy first, advice last. The tone is a calm friend with a developmental-psych background — not a clinical report, not a lecture.",
      },
      {
        q: "What happens to what I whisper?",
        a: "Your voice is transcribed transiently and not retained by us. Moments and child profiles live on your device. No ads, no selling data, and nothing you say is used to train models.",
      },
      {
        q: "How does the free trial work?",
        a: "You can use Kidsit AI free with one child, no time limit. Premium (unlimited children, patterns over time) comes as a monthly or yearly plan, and both start with a 7-day free trial for new subscribers. Cancel anytime in Settings → Apple ID → Subscriptions.",
      },
      {
        q: "Is it on Android?",
        a: "Yes. Kidsit AI is available for both iPhone and Android — grab it from the App Store or Google Play. Same app, same coach, either phone.",
      },
    ],
  },
  footer: {
    tagline: "Calm guidance for hard moments. Built by a parent, for parents.",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "See it work", href: "#demo" },
      { label: "FAQ", href: "#faq" },
      { label: "Privacy", href: "/en/privacy" },
      { label: "Terms", href: "/en/terms" },
    ],
    disclaimer:
      "© 2026 Kidsit.ai. This app is not a substitute for professional, medical, or psychological advice. It is designed to provide parents with smart, sensitive, and practical guidance for dealing with everyday situations in real-time.",
  },
  legal: {
    back: "← Back to kidsit·ai",
    home: "/en",
  },
};

export type Dict = typeof en;

const he: Dict = {
  dir: "rtl",
  meta: {
    title: "Kidsit AI — הדרכה רגועה לרגעים הקשים",
    description:
      "מספרים מה קרה עכשיו עם הילד ומקבלים הדרכה חמה ומבוססת מדע תוך שניות — בלי שיפוטיות ובלי הרצאות.",
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
  },
  hero: {
    badge: "הקופיילוט ההורי שלכם · ★ 5.0 ב-App Store",
    h1a: "הדרכה חכמה,",
    h1b: "בדיוק",
    h1Scribbled: "כשצריכים אותה.",
    sub: "לוחצים על המיקרופון ומספרים מה קרה עכשיו עם הילד — גם כשהידיים מלאות. עשר שניות אחר כך: הדרכה מעשית ומותאמת אישית, בזמן אמת.",
    ctaApple: "App Store",
    ctaPlay: "Google Play",
    ctaSecondary: "צפו איך זה עובד",
    chipWhisper: "🎙️ מספרים מה קרה",
    chipTime: "⏱️ ‎~10 שניות לתוכנית",
    screenshotAlt:
      "מסך הבית של Kidsit AI: ‏\"מה קרה עם תום?\" עם כפתור מיקרופון בלחיצה ממושכת באמצע הקלטה",
  },
  features: {
    heading: "נבנה בשביל 10 הדקות הקשות של היום",
    sub: "הילד על הרצפה, השעה 18:00, ואי אפשר בדיוק לגגל את זה באמצע התקף זעם.",
    cards: [
      {
        emoji: "⚡",
        title: "עזרה מיידית בכל סיטואציה",
        desc: "הדרכה מעשית ומותאמת אישית ברגע שמתעורר אתגר עם הילד — בקול או בהקלדה, גם כשהידיים מלאות.",
      },
      {
        emoji: "🧠",
        title: "מותאם לילד שלכם",
        desc: "המערכת לומדת את המאפיינים של הילד ומתאימה את הייעוץ בהתאם. סימנתם ש\"לא עזר\"? התשובה הבאה תנסה כיוון אחר.",
      },
      {
        emoji: "🌙",
        title: "סיכום יומי",
        desc: "תובנות על הדפוסים והאתגרים של היום, וטיפים למחר — כדי שהרגעים הקשים יהפכו למשהו שאפשר לראות ולתכנן סביבו.",
      },
    ],
  },
  showcase: {
    heading: "ככה נראית תשובה אמיתית",
    sub: "חצי דקה, רגע אחד שסיפרתם, ומה שחוזר.",
    captions: [
      "מבט שני, רך יותר — לא הרצאה ולא תווית",
      "הדפוסים נהיים גלויים עם הזמן",
    ],
  },
  social: {
    heading: "הורים ממליצים",
    stats: [
      { value: "5.0★", label: "ב-App Store" },
      { value: "‎~10 שניות", label: "מסיפור לתוכנית" },
      { value: "ילד אחד חינם", label: "ללא הגבלת זמן" },
    ],
    quotes: [
      {
        quote:
          "האפליקציה לא רק אמרה לי מה לעשות ברגע עצמו — היא עזרה לי להבין את התמונה הגדולה שמאחורי ההתנהגות. ממליץ בחום לכל הורה שמחפש תמיכה ואסטרטגיות שעובדות.",
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
    heading: "חינם עם ילד אחד. השאר בניסיון חינם.",
    sub: "פרימיום מתחיל בשבוע ניסיון חינם. ביטול בכל רגע בהגדרות ← מנויים.",
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
        "ילדים ללא הגבלה",
        "דפוסים וזיכרון לאורך זמן",
        "סיכומים יומיים",
        "ביטול בכל עת",
      ],
    },
  },
  faq: {
    heading: "השאלות שכל הורה שואל",
    items: [
      {
        q: "זה תחליף לטיפול או לייעוץ רפואי?",
        a: "לא. Kidsit AI היא מלווה הורות רפלקטיבית לרגעים היומיומיים — התקפי זעם, מאבקי שינה, ריבים בין אחים. היא לא מאבחנת ולא מטפלת, ואם משהו נוגע לבטיחות, להתפתחות או לבריאות הנפשית של הילד — היא תגיד לכם בפירוש לפנות לרופא ילדים, למטפל או לאיש מקצוע מוסמך.",
      },
      {
        q: "מאיפה מגיעות העצות?",
        a: "ההדרכה מבוססת על עשרות שנים של מחקר בהתפתחות הילד ועל גישות הורות מוכרות: קודם אמפתיה, אחר כך עצה. הטון הוא של חבר רגוע עם רקע בפסיכולוגיה התפתחותית — לא דוח קליני ולא הרצאה.",
      },
      {
        q: "מה קורה עם מה שאני מספר?",
        a: "ההקלטה מתומללת באופן זמני ולא נשמרת אצלנו. הרגעים ופרופילי הילדים נשמרים על המכשיר שלכם בלבד. בלי פרסומות, בלי מכירת מידע — ושום דבר שאתם אומרים לא משמש לאימון מודלים.",
      },
      {
        q: "איך עובד הניסיון החינמי?",
        a: "אפשר להשתמש ב-Kidsit AI חינם עם ילד אחד, ללא הגבלת זמן. פרימיום (ילדים ללא הגבלה, דפוסים לאורך זמן) מגיע במנוי חודשי או שנתי, ושניהם מתחילים בשבוע ניסיון חינם למנויים חדשים. ביטול בכל רגע בהגדרות ← Apple ID ← מנויים.",
      },
      {
        q: "יש גרסה לאנדרואיד?",
        a: "כן. Kidsit AI זמינה גם לאייפון וגם לאנדרואיד — מורידים מה-App Store או מ-Google Play. אותה אפליקציה, אותו מאמן, בכל טלפון.",
      },
    ],
  },
  footer: {
    tagline: "הדרכה רגועה לרגעים הקשים. נבנה על ידי הורה, בשביל הורים.",
    links: [
      { label: "תכונות", href: "#features" },
      { label: "מחירים", href: "#pricing" },
      { label: "איך זה עובד", href: "#demo" },
      { label: "שאלות נפוצות", href: "#faq" },
      { label: "פרטיות", href: "/he/privacy" },
      { label: "תנאי שימוש", href: "/he/terms" },
    ],
    disclaimer:
      "© 2026 Kidsit.ai. האפליקציה אינה תחליף לייעוץ מקצועי, רפואי או פסיכולוגי. היא נועדה להעניק להורים הדרכה חכמה, רגישה ומעשית להתמודדות עם סיטואציות יומיומיות בזמן אמת.",
  },
  legal: {
    back: "→ חזרה ל-kidsit·ai",
    home: "/he",
  },
};

export const dictionaries: Record<Lang, Dict> = { en, he };
