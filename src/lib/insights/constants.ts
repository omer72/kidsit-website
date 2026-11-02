// Closed lists from the digest spec (taxonomy_v 1). Unknown values are rejected.
export const SITUATIONS = [
  "transitions",
  "bedtime_sleep",
  "screens",
  "homework_tasks",
  "limits_cooperation",
  "tantrum_anger",
  "siblings",
  "social_friends",
  "fears_anxiety",
  "eating",
  "other",
] as const;

export const MOVES = [
  "acknowledge",
  "name_feeling",
  "fantasy",
  "choice",
  "describe",
  "give_info",
  "one_word",
  "own_feeling",
  "note",
  "amends",
  "problem_solving",
  "hint",
  "overhear",
  "co_regulate",
  "connect",
  "other",
] as const;

export const LANGS = ["he", "en", "es"] as const;
export const PLATFORMS = ["ios", "android"] as const;
export const PERIODS = ["day", "week"] as const;

export const SCHEMA_V = 1;
export const TAXONOMY_V = 1;

// Caps stop a single outlier count or essay from becoming a fingerprint.
export const COUNT_MAX = 30;
export const FREE_TEXT_MAX_CHARS = 500;
export const BODY_MAX_BYTES = 4096;
export const FREE_TEXT_RETENTION_DAYS = 90;

export const TOP_LEVEL_FIELDS = [
  "schema_v",
  "taxonomy_v",
  "period",
  "period_key",
  "lang",
  "platform",
  "app_version",
  "situations",
  "moves",
  "rating",
  "free_text",
  "free_text_scrubbed",
] as const;

export const SITUATION_FIELDS = ["type", "great", "better", "same", "worse", "unrated"] as const;
export const MOVE_FIELDS = ["move", "worked", "not_worked"] as const;

// Columns written for a submission. There is no IP, user id, device id, or precise timestamp.
export const SUBMISSION_COLUMNS = [
  "schema_v",
  "taxonomy_v",
  "period",
  "period_key",
  "lang",
  "platform",
  "app_version",
  "rating",
  "free_text",
  "free_text_expires_on",
] as const;

const ID_LIKE_KEYS = new Set([
  "id",
  "uuid",
  "user_id",
  "userid",
  "device_id",
  "deviceid",
  "install_id",
  "installid",
  "app_user_id",
  "appuserid",
  "rc_user",
  "rcuser",
  "x_rc_user",
  "revenuecat_id",
  "revenuecatid",
  "anonymous_id",
  "anonymousid",
  "ip",
  "ip_address",
  "ipaddress",
  "client_ip",
  "user_agent",
  "useragent",
  "email",
  "phone",
  "kid_id",
  "kidid",
  "child_id",
  "childid",
]);

export function isIdLikeKey(key: string): boolean {
  const norm = key.trim().toLowerCase().replace(/-/g, "_");
  const compact = norm.replace(/_/g, "");
  if (ID_LIKE_KEYS.has(norm) || ID_LIKE_KEYS.has(compact)) return true;
  return /(user|device|install|child|kid|revenuecat|anonymous)_?id$/i.test(norm);
}
