import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { CONSENT_KEY, CONSENT_VERSION } from "./consent";
import { META_PIXEL_BOOTSTRAP } from "./meta-pixel-bootstrap";
import {
  CONSENT_MAX_AGE_MS,
  META_PIXEL_ID,
  META_PIXEL_SRC,
  hasMetaConsent,
  isMetaPixelLoaded,
  metaConsentAllowsPixel,
  shouldTrackMetaRouteChange,
} from "./meta-pixel";

const DAY = 24 * 3600 * 1000;

function record(analytics: boolean, ageMs = 0) {
  return { v: CONSENT_VERSION, ts: new Date(Date.now() - ageMs).toISOString(), analytics };
}

type ScriptNode = {
  src: string;
  async?: boolean;
  parentNode: { insertBefore: (n: ScriptNode, ref: ScriptNode) => void; removeChild: (n: ScriptNode) => void; appendChild?: (n: ScriptNode) => void } | null;
  id?: string;
};

type FbqStub = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: ArrayLike<unknown>[];
  loaded?: boolean;
  version?: string;
};

function harness(options?: { storage?: Record<string, string>; throwOnRead?: boolean }) {
  const bag = new Map(Object.entries(options?.storage ?? {}));
  const nodes: ScriptNode[] = [];
  let created = 0;
  const listeners: Array<(event: { detail?: unknown }) => void> = [];

  const head = {
    appendChild(node: ScriptNode) {
      node.parentNode = head;
      nodes.push(node);
    },
    insertBefore(node: ScriptNode, ref: ScriptNode) {
      node.parentNode = head;
      const i = nodes.indexOf(ref);
      if (i < 0) nodes.push(node);
      else nodes.splice(i, 0, node);
    },
    removeChild(node: ScriptNode) {
      const i = nodes.indexOf(node);
      if (i >= 0) nodes.splice(i, 1);
      node.parentNode = null;
    },
  };

  const seed: ScriptNode = { src: "", id: "meta-pixel", parentNode: head };
  nodes.push(seed);

  const document = {
    head,
    documentElement: head,
    getElementsByTagName(tag: string) {
      return tag === "script" ? nodes : [];
    },
    createElement(tag: string) {
      if (tag === "script") created += 1;
      const el: ScriptNode = { src: "", async: false, parentNode: null };
      return el;
    },
  };

  const window = {
    document,
    localStorage: {
      getItem(key: string) {
        if (options?.throwOnRead) throw new Error("storage blocked");
        return bag.has(key) ? bag.get(key)! : null;
      },
    },
    addEventListener(type: string, fn: (event: { detail?: unknown }) => void) {
      if (type === "kidsit-consent") listeners.push(fn);
    },
  };

  const context = vm.createContext({
    window,
    document,
    Date,
    JSON,
  });
  vm.runInContext(META_PIXEL_BOOTSTRAP, context, { filename: "meta-pixel.js" });

  const fbq = () => (window as { fbq?: FbqStub }).fbq;

  return {
    window: window as typeof window & { fbq?: FbqStub; __kidsitMetaGranted?: boolean; __kidsitMetaBootstrap?: number },
    created: () => created,
    fbevents() {
      return nodes.filter((n) => n.src.includes("fbevents.js"));
    },
    tr() {
      return nodes.filter((n) => n.src.includes("facebook.com/tr"));
    },
    queue() {
      const q = fbq()?.queue;
      if (!q) return [];
      return Array.prototype.slice.call(q).map((args) => Array.prototype.slice.call(args as ArrayLike<unknown>));
    },
    emit(detail: unknown) {
      for (const fn of listeners) fn({ detail });
    },
    again() {
      vm.runInContext(META_PIXEL_BOOTSTRAP, context, { filename: "meta-pixel.js" });
    },
  };
}

test("consent window matches the banner script", () => {
  assert.equal(CONSENT_MAX_AGE_MS, 31536e6);
  assert.equal(META_PIXEL_BOOTSTRAP.includes("facebook.com/tr"), false);
  assert.equal(META_PIXEL_BOOTSTRAP.toLowerCase().includes("</script"), false);
  assert.equal(META_PIXEL_BOOTSTRAP.includes("kidsit-consent-open"), false);
  assert.match(META_PIXEL_BOOTSTRAP, /addEventListener\("kidsit-consent"/);
  assert.match(META_PIXEL_BOOTSTRAP, /fbq\("consent", "revoke"\)/);
  assert.match(META_PIXEL_BOOTSTRAP, new RegExp(META_PIXEL_ID));
  assert.match(META_PIXEL_BOOTSTRAP, /connect\.facebook\.net\/en_US\/fbevents\.js/);
});

test("layout inlines one head bootstrap and no noscript pixel", () => {
  const layout = readFileSync(new URL("../app/[lang]/layout.tsx", import.meta.url), "utf8");
  const headStart = layout.indexOf("<head>");
  const headEnd = layout.indexOf("</head>");
  assert.ok(headStart >= 0 && headEnd > headStart);
  const head = layout.slice(headStart, headEnd);
  assert.equal((head.match(/id="meta-pixel"/g) || []).length, 1);
  assert.match(head, /META_PIXEL_BOOTSTRAP/);
  assert.equal(layout.includes("facebook.com/tr"), false);
  assert.equal(layout.includes("connect.facebook.net"), false);
  assert.equal(layout.includes("<noscript"), false);
  assert.match(layout, /<MetaPixelPageView\s*\/>/);
});

test("stored analytics consent loads fbevents once and queues a single PageView", () => {
  const saved = record(true);
  assert.equal(metaConsentAllowsPixel(saved), true);
  const h = harness({ storage: { [CONSENT_KEY]: JSON.stringify(saved) } });
  assert.equal(h.created(), 1);
  assert.equal(h.fbevents().length, 1);
  assert.equal(h.fbevents()[0].src, META_PIXEL_SRC);
  assert.equal(h.tr().length, 0);
  assert.deepEqual(h.queue(), [
    ["init", META_PIXEL_ID],
    ["track", "PageView"],
  ]);
  assert.equal(h.window.__kidsitMetaGranted, true);
  h.again();
  assert.equal(h.fbevents().length, 1);
  assert.equal(h.queue().length, 2);
});

test("no choice, decline, expiry, and a bad version create no facebook script", () => {
  const cases: Array<{ name: string; raw: unknown }> = [
    { name: "missing", raw: null },
    { name: "declined", raw: record(false) },
    { name: "expired", raw: record(true, CONSENT_MAX_AGE_MS + DAY) },
    { name: "wrong version", raw: { ...record(true), v: CONSENT_VERSION + 1 } },
    { name: "no timestamp", raw: { v: CONSENT_VERSION, analytics: true } },
  ];
  for (const c of cases) {
    assert.equal(metaConsentAllowsPixel(c.raw), false, c.name);
    const storage = c.raw ? { [CONSENT_KEY]: JSON.stringify(c.raw) } : {};
    const h = harness({ storage });
    assert.equal(h.created(), 0, c.name);
    assert.equal(h.fbevents().length, 0, c.name);
    assert.equal(h.tr().length, 0, c.name);
    assert.deepEqual(h.queue(), [], c.name);
    assert.equal(h.window.__kidsitMetaGranted, false, c.name);
  }
});

test("accept event loads the pixel once and a second accept does not double PageView", () => {
  const h = harness();
  assert.equal(h.created(), 0);
  const choice = record(true);
  h.emit(choice);
  h.emit(choice);
  assert.equal(h.created(), 1);
  assert.equal(h.fbevents().length, 1);
  assert.equal(h.fbevents()[0].src, META_PIXEL_SRC);
  assert.deepEqual(h.queue(), [
    ["init", META_PIXEL_ID],
    ["track", "PageView"],
  ]);
  assert.equal(h.window.__kidsitMetaGranted, true);
});

test("reject event never inserts fbevents and does not queue a revoke", () => {
  const h = harness();
  h.emit(record(false));
  assert.equal(h.created(), 0);
  assert.equal(h.fbevents().length, 0);
  assert.deepEqual(h.queue(), []);
  assert.equal(h.window.__kidsitMetaGranted, false);
});

test("withdraw before the library loads drops the queued hit and the script tag", () => {
  const h = harness();
  h.emit(record(true));
  assert.equal(h.fbevents().length, 1);
  h.emit(record(false));
  assert.equal(h.fbevents().length, 0);
  assert.deepEqual(h.queue(), []);
  assert.equal(h.window.__kidsitMetaGranted, false);
  assert.equal(isMetaPixelLoaded(h.window.fbq), false);
});

test("withdraw after fbevents is live revokes, and accepting again grants one PageView", () => {
  const h = harness();
  h.emit(record(true));
  const calls: unknown[][] = [];
  h.window.fbq!.callMethod = (...args: unknown[]) => {
    calls.push(args);
  };
  h.emit(record(false));
  h.emit(record(true));
  assert.deepEqual(calls, [
    ["consent", "revoke"],
    ["consent", "grant"],
    ["track", "PageView"],
  ]);
  assert.equal(h.fbevents().length, 1);
  assert.equal(h.window.__kidsitMetaGranted, true);
  assert.equal(isMetaPixelLoaded(h.window.fbq), true);
});

test("blocked storage still loads on the accept event and not before", () => {
  const h = harness({ throwOnRead: true });
  assert.equal(h.created(), 0);
  assert.equal(h.window.__kidsitMetaGranted, false);
  h.emit(record(true));
  assert.equal(h.fbevents().length, 1);
  assert.equal(h.window.__kidsitMetaGranted, true);
});

test("pre-consent stub is not a loaded pixel", () => {
  const h = harness();
  assert.equal(typeof h.window.fbq, "function");
  assert.equal(isMetaPixelLoaded(h.window.fbq), false);
  h.window.fbq!.callMethod = function () {};
  assert.equal(isMetaPixelLoaded(h.window.fbq), true);
});

test("route PageView skips the first path and anything without consent or a live pixel", () => {
  const loaded = { isFirstObservedPath: false, samePath: false, analyticsConsent: true, pixelLoaded: true };
  assert.equal(shouldTrackMetaRouteChange({ ...loaded, isFirstObservedPath: true }), false);
  assert.equal(shouldTrackMetaRouteChange({ ...loaded, samePath: true }), false);
  assert.equal(shouldTrackMetaRouteChange({ ...loaded, analyticsConsent: false }), false);
  assert.equal(shouldTrackMetaRouteChange({ ...loaded, pixelLoaded: false }), false);
  assert.equal(shouldTrackMetaRouteChange(loaded), true);

  const now = 1_700_000_000_000;
  const fresh = { v: 1, ts: new Date(now).toISOString(), analytics: true };
  assert.equal(hasMetaConsent({ grantedFlag: undefined, stored: fresh, now }), true);
  assert.equal(hasMetaConsent({ grantedFlag: false, stored: fresh, now }), false);
  assert.equal(hasMetaConsent({ grantedFlag: true, stored: null, now }), true);
  assert.equal(hasMetaConsent({ grantedFlag: undefined, stored: { ...fresh, analytics: false }, now }), false);
  const expired = { ...fresh, ts: new Date(now - CONSENT_MAX_AGE_MS - 1).toISOString() };
  assert.equal(metaConsentAllowsPixel(expired, now), false);
  const onTheLine = { ...fresh, ts: new Date(now - CONSENT_MAX_AGE_MS).toISOString() };
  assert.equal(metaConsentAllowsPixel(onTheLine, now), true);
});
