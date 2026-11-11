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
export const FUNNEL_FIELDS = ["v", "step", "platform", "lang", "app_version", "source"] as const;

// Major.minor only, and a short lowercase token (a utm_source). Anything else is rejected, so neither
// field can carry an identifier or grow the table without bound.
export const FUNNEL_VERSION_RE = /^[0-9]{1,3}\.[0-9]{1,3}$/;
export const FUNNEL_SOURCE_RE = /^[a-z0-9][a-z0-9_.-]{0,39}$/;
