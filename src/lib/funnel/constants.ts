// Closed list of funnel steps, in funnel order. The app reports each one once per install.
export const FUNNEL_STEPS = [
  "onboarding_done",
  "child_added",
  "moment_sent",
  "answer_received",
  "moment_rated",
  "paywall_shown",
  "paywall_dismissed",
  "purchase",
] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number];

export const FUNNEL_SCHEMA_V = 1;
export const FUNNEL_BODY_MAX_BYTES = 512;
export const FUNNEL_FIELDS = ["v", "step", "platform", "lang", "app_version", "source", "entry"] as const;

// Which screen opened the paywall. Closed list, and only on the paywall_shown step; any other step
// that carries `entry` is rejected.
export const FUNNEL_ENTRIES = ["first_moment", "free_limit", "add_child", "settings"] as const;
export type FunnelEntry = (typeof FUNNEL_ENTRIES)[number];
export const FUNNEL_ENTRY_STEP: FunnelStep = "paywall_shown";

// Major.minor, or major.minor.patch (the app now sends the full version, e.g. 1.0.14; the old 1.0 form
// still works), and a short lowercase token (a utm_source). Anything else is rejected, so neither field
// can carry an identifier or grow the table without bound. The database CHECK in
// db/migrations/003_funnel_app_version_entry.sql accepts the same shape.
export const FUNNEL_VERSION_RE = /^[0-9]{1,3}\.[0-9]{1,3}(\.[0-9]{1,3})?$/;
export const FUNNEL_SOURCE_RE = /^[a-z0-9][a-z0-9_.-]{0,39}$/;
