# Store privacy labels for anonymous insights

Enter these by hand in App Store Connect and Google Play Console. This repository does not call the store APIs and does not change the live listings.

The answers below are the spec’s answers, including the spec’s recommendation to declare the data even where Apple’s Product Improvement Program exemption might apply, and to answer Yes on Play’s deletion question because free text is deleted after 90 days.

## App Store privacy nutrition labels

Keep the labels already documented for the app:

| Data type | Purpose | Linked to user | Tracking |
|---|---|---|---|
| Audio Data | App Functionality | No | No |
| Other User Content | App Functionality | No | No |
| Purchases | App Functionality | No | No |

Add or extend for the digest send:

| Data type | Purpose | Linked to user | Tracking |
|---|---|---|---|
| Usage Data → Product Interaction (worked / did not work counts by situation, and the 1–5 rating) | Analytics | No | No |
| User Content → Other User Content (the optional free text). This type is already declared. Add Analytics as a purpose; keep App Functionality. | Analytics, in addition to App Functionality | No | No |

“Not linked” is only true if the submission has no user, device, install, or RevenueCat id and is not later joined to another dataset. The `/api/insights` route is built that way: random row id, ISO week only, no IP stored in Neon.

Apple treats a qualifying Product Improvement Program as optional to disclose. The spec’s recommendation, and the choice used here, is to **declare it anyway**.

Related note from the spec, separate from insights: RevenueCat’s guidance is that Purchase History should also be marked **Analytics**, not only App Functionality. If guidance notes can include diagnoses, consider whether “Other User Content” is enough for that existing flow. Apple’s rule is that a type you explicitly ask for should be declared.

## Google Play Data safety

Add:

| Data type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|
| App activity → App interactions (counts and rating) | Yes | No | Yes — users can choose | Analytics |
| App activity → Other user-generated content (free text) | Yes | No | Yes — users can choose | Analytics |

Also set:

- **Encrypted in transit:** Yes. The app uses HTTPS for kidsit.ai, and the existing OpenAI and RevenueCat calls are HTTPS too.
- **Data deletion:** Yes. Free text is deleted automatically within 90 days, and the counts are anonymous. Play’s FAQ allows Yes when data is deleted or anonymized automatically within 90 days, or when there is a request mechanism. The policy states that one specific anonymous submission cannot be looked up. This Yes is the spec’s recommendation; change it in the console if counsel disagrees.
- **Shared:** No. Neon and Vercel are service providers for this storage, not a sale or a share with another business for their own use.

Play has no “anonymous” exemption for collection. Anonymous data still counts as collected. The anonymous exemption applies to sharing only, so Shared stays No and Collected stays Yes.
