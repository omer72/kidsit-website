import {
  COUNT_MAX,
  FREE_TEXT_MAX_CHARS,
  FREE_TEXT_RETENTION_DAYS,
  LANGS,
  MOVE_FIELDS,
  MOVES,
  PERIODS,
  PLATFORMS,
  SCHEMA_V,
  SITUATION_FIELDS,
  SITUATIONS,
  TAXONOMY_V,
  TOP_LEVEL_FIELDS,
  isIdLikeKey,
} from "./constants";
import { scrubFreeText } from "./scrub";

export type InsightIssue = { path: string; code: string };

export type SituationCount = {
  type: (typeof SITUATIONS)[number];
  great: number;
  better: number;
  same: number;
  worse: number;
  unrated: number;
};

export type MoveCount = {
  move: (typeof MOVES)[number];
  worked: number;
  not_worked: number;
};

export type ValidatedInsight = {
  schema_v: typeof SCHEMA_V;
  taxonomy_v: typeof TAXONOMY_V;
  period: (typeof PERIODS)[number];
  period_key: string;
  lang: (typeof LANGS)[number];
  platform: (typeof PLATFORMS)[number];
  app_version: string;
  situations: SituationCount[];
  moves: MoveCount[];
  rating: number | null;
  free_text: string | null;
  free_text_expires_on: string | null;
};

const APP_VERSION = /^(0|[1-9]\d?)\.(0|[1-9]\d?)$/;
const ISSUE_CAP = 32;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function charLength(value: string): number {
  let count = 0;
  for (let i = 0; i < value.length; ) {
    const code = value.codePointAt(i) ?? 0;
    i += code > 0xffff ? 2 : 1;
    count += 1;
  }
  return count;
}

// Week 53 exists only in some years. A day or a timestamp is never accepted.
export function isIsoWeekKey(value: string): boolean {
  const match = /^(\d{4})-W(0[1-9]|[1-4]\d|5[0-3])$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 53) return true;
  const jan1 = new Date(Date.UTC(year, 0, 1)).getUTCDay();
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return jan1 === 4 || (leap && jan1 === 3);
}

// Sunday of the UTC week the row arrives, plus 90 days. The column stays at
// week granularity, so it does not record which weekday the request came in.
export function freeTextExpiresOn(now: Date): string {
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = utc.getUTCDay();
  const untilSunday = day === 0 ? 0 : 7 - day;
  utc.setUTCDate(utc.getUTCDate() + untilSunday + FREE_TEXT_RETENTION_DAYS);
  return utc.toISOString().slice(0, 10);
}

function push(issues: InsightIssue[], path: string, code: string) {
  if (issues.length < ISSUE_CAP) issues.push({ path, code });
}

function collectIdLike(value: unknown, path: string, issues: InsightIssue[]) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectIdLike(item, `${path}[${index}]`, issues));
    return;
  }
  if (!isPlainObject(value)) return;
  for (const key of Object.keys(value)) {
    const next = path ? `${path}.${key}` : key;
    if (isIdLikeKey(key)) push(issues, next, "id_like_field");
    collectIdLike(value[key], next, issues);
  }
}

function unexpectedKeys(obj: Record<string, unknown>, allowed: readonly string[], path: string, issues: InsightIssue[]) {
  for (const key of Object.keys(obj)) {
    if (isIdLikeKey(key)) continue;
    if (!allowed.includes(key)) push(issues, path ? `${path}.${key}` : key, "unexpected_field");
  }
}

function readCount(value: unknown, path: string, issues: InsightIssue[]): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    push(issues, path, "invalid_type");
    return null;
  }
  if (value < 0 || value > COUNT_MAX) {
    push(issues, path, "count_out_of_range");
    return null;
  }
  return value;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], path: string, issues: InsightIssue[]): T | null {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    push(issues, path, "unknown_enum");
    return null;
  }
  return value as T;
}

export function validateInsight(input: unknown, now = new Date()): { ok: true; value: ValidatedInsight } | { ok: false; issues: InsightIssue[] } {
  const issues: InsightIssue[] = [];
  collectIdLike(input, "", issues);
  if (!isPlainObject(input)) {
    push(issues, "", "invalid_type");
    return { ok: false, issues };
  }
  unexpectedKeys(input, TOP_LEVEL_FIELDS, "", issues);

  if (input.schema_v !== SCHEMA_V) push(issues, "schema_v", "unsupported_schema");
  if (input.taxonomy_v !== TAXONOMY_V) push(issues, "taxonomy_v", "unsupported_taxonomy");

  const period = oneOf(input.period, PERIODS, "period", issues);
  if (typeof input.period_key !== "string" || !isIsoWeekKey(input.period_key)) push(issues, "period_key", "invalid_period_key");
  const lang = oneOf(input.lang, LANGS, "lang", issues);
  const platform = oneOf(input.platform, PLATFORMS, "platform", issues);
  if (typeof input.app_version !== "string" || !APP_VERSION.test(input.app_version)) push(issues, "app_version", "invalid_app_version");

  const situations: SituationCount[] = [];
  if (!Array.isArray(input.situations)) {
    push(issues, "situations", "invalid_type");
  } else {
    if (input.situations.length > SITUATIONS.length) push(issues, "situations", "too_many_items");
    const seen = new Set<string>();
    input.situations.forEach((item, index) => {
      const path = `situations[${index}]`;
      if (!isPlainObject(item)) {
        push(issues, path, "invalid_type");
        return;
      }
      unexpectedKeys(item, SITUATION_FIELDS, path, issues);
      const type = oneOf(item.type, SITUATIONS, `${path}.type`, issues);
      const great = readCount(item.great, `${path}.great`, issues);
      const better = readCount(item.better, `${path}.better`, issues);
      const same = readCount(item.same, `${path}.same`, issues);
      const worse = readCount(item.worse, `${path}.worse`, issues);
      const unrated = readCount(item.unrated, `${path}.unrated`, issues);
      if (type && seen.has(type)) push(issues, `${path}.type`, "duplicate_key");
      if (type) seen.add(type);
      if (type && great !== null && better !== null && same !== null && worse !== null && unrated !== null) {
        situations.push({ type, great, better, same, worse, unrated });
      }
    });
  }

  const moves: MoveCount[] = [];
  if (input.moves !== undefined) {
    if (!Array.isArray(input.moves)) {
      push(issues, "moves", "invalid_type");
    } else {
      if (input.moves.length > MOVES.length) push(issues, "moves", "too_many_items");
      const seen = new Set<string>();
      input.moves.forEach((item, index) => {
        const path = `moves[${index}]`;
        if (!isPlainObject(item)) {
          push(issues, path, "invalid_type");
          return;
        }
        unexpectedKeys(item, MOVE_FIELDS, path, issues);
        const move = oneOf(item.move, MOVES, `${path}.move`, issues);
        const worked = readCount(item.worked, `${path}.worked`, issues);
        const notWorked = readCount(item.not_worked, `${path}.not_worked`, issues);
        if (move && seen.has(move)) push(issues, `${path}.move`, "duplicate_key");
        if (move) seen.add(move);
        if (move && worked !== null && notWorked !== null) moves.push({ move, worked, not_worked: notWorked });
      });
    }
  }

  let rating: number | null = null;
  if (input.rating !== undefined) {
    if (typeof input.rating !== "number" || !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      push(issues, "rating", "invalid_rating");
    } else {
      rating = input.rating;
    }
  }

  let freeText: string | null = null;
  let expires: string | null = null;
  if (input.free_text !== undefined) {
    if (typeof input.free_text !== "string") {
      push(issues, "free_text", "invalid_type");
    } else {
      const trimmed = input.free_text.trim();
      if (charLength(trimmed) > FREE_TEXT_MAX_CHARS) {
        push(issues, "free_text", "text_too_long");
      } else if (trimmed.length > 0) {
        if (input.free_text_scrubbed !== true) push(issues, "free_text_scrubbed", "scrub_not_confirmed");
        const scrubbed = scrubFreeText(trimmed).trim();
        if (scrubbed.length > 0) {
          freeText = scrubbed;
          expires = freeTextExpiresOn(now);
        }
      }
    }
  } else if (input.free_text_scrubbed !== undefined && typeof input.free_text_scrubbed !== "boolean") {
    push(issues, "free_text_scrubbed", "invalid_type");
  }
  if (input.free_text !== undefined && input.free_text_scrubbed !== undefined && typeof input.free_text_scrubbed !== "boolean") {
    push(issues, "free_text_scrubbed", "invalid_type");
  }

  if (issues.length > 0 || !period || !lang || !platform || typeof input.period_key !== "string" || typeof input.app_version !== "string") {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      schema_v: SCHEMA_V,
      taxonomy_v: TAXONOMY_V,
      period,
      period_key: input.period_key,
      lang,
      platform,
      app_version: input.app_version,
      situations,
      moves,
      rating,
      free_text: freeText,
      free_text_expires_on: expires,
    },
  };
}
