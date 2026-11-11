import { LANGS, PLATFORMS } from "@/lib/insights/constants";
import {
  FUNNEL_FIELDS,
  FUNNEL_SCHEMA_V,
  FUNNEL_SOURCE_RE,
  FUNNEL_STEPS,
  FUNNEL_VERSION_RE,
  type FunnelStep,
} from "./constants";

export type FunnelIssue = { path: string; code: string };

/** '' means the app did not send that dimension. */
export type ValidatedFunnelEvent = {
  step: FunnelStep;
  platform: "" | (typeof PLATFORMS)[number];
  lang: "" | (typeof LANGS)[number];
  app_version: string;
  source: string;
};

export type FunnelValidation = { ok: true; value: ValidatedFunnelEvent } | { ok: false; issues: FunnelIssue[] };

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

/** Strict: unknown fields are rejected, so an identifier cannot ride along. */
export function validateFunnelEvent(input: unknown): FunnelValidation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, issues: [{ path: "", code: "not_an_object" }] };
  }
  const body = input as Record<string, unknown>;
  const issues: FunnelIssue[] = [];

  for (const key of Object.keys(body)) {
    if (!(FUNNEL_FIELDS as readonly string[]).includes(key)) issues.push({ path: key, code: "unknown_field" });
  }
  if (body.v !== FUNNEL_SCHEMA_V) issues.push({ path: "v", code: "unsupported" });
  if (!isOneOf(FUNNEL_STEPS, body.step)) issues.push({ path: "step", code: "invalid" });

  const optional = <T extends string>(key: string, ok: (v: unknown) => v is T): "" | T => {
    const v = body[key];
    if (v === undefined) return "";
    if (ok(v)) return v;
    issues.push({ path: key, code: "invalid" });
    return "";
  };
  const matches = (re: RegExp) => (v: unknown): v is string => typeof v === "string" && re.test(v);

  const platform = optional("platform", (v): v is (typeof PLATFORMS)[number] => isOneOf(PLATFORMS, v));
  const lang = optional("lang", (v): v is (typeof LANGS)[number] => isOneOf(LANGS, v));
  const app_version = optional("app_version", matches(FUNNEL_VERSION_RE));
  const source = optional("source", matches(FUNNEL_SOURCE_RE));

  if (issues.length) return { ok: false, issues };
  return { ok: true, value: { step: body.step as FunnelStep, platform, lang, app_version, source } };
}
