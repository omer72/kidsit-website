// Pluggable sources for /admin/stats. GA4 and Search Console are not wired yet: each provider reports which env vars
// it needs, and returns "not_connected" until its fetch is implemented. Add a provider by implementing load().

export type ProviderResult =
  | { state: "not_connected"; missing: string[]; note?: string }
  | { state: "error"; error: string }
  | { state: "ok"; rows: { label: string; value: string }[] };

export interface StatsProvider {
  id: string;
  title: string;
  env: string[];
  load(env: Record<string, string | undefined>): Promise<ProviderResult>;
}

const missingEnv = (names: string[], env: Record<string, string | undefined>) => names.filter((n) => !env[n]?.trim());

function pending(id: string, title: string, envNames: string[]): StatsProvider {
  return {
    id,
    title,
    env: envNames,
    async load(env) {
      const missing = missingEnv(envNames, env);
      if (missing.length) return { state: "not_connected", missing };
      return { state: "not_connected", missing: [], note: "המשתנים מוגדרים, אבל החיבור עצמו עוד לא מומש." };
    },
  };
}

export const GA4_PROVIDER = pending("ga4", "Google Analytics 4", ["GOOGLE_SERVICE_ACCOUNT_JSON", "GA4_PROPERTY_ID"]);
export const GSC_PROVIDER = pending("gsc", "Google Search Console", ["GOOGLE_SERVICE_ACCOUNT_JSON", "GSC_SITE_URL"]);
export const EXTRA_PROVIDERS: StatsProvider[] = [GA4_PROVIDER, GSC_PROVIDER];
