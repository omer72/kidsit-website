import { CONSENT_KEY, CONSENT_VERSION } from "./consent";
import { CONSENT_MAX_AGE_MS, META_PIXEL_ID, META_PIXEL_SRC } from "./meta-pixel";

/**
 * Inline head bootstrap. Installs a queue stub immediately and does not insert fbevents.js
 * until analytics consent is already stored or the banner dispatches kidsit-consent.
 * A queued fbq('consent','revoke') still fetches the library once something loads it,
 * so the loader stays out of the DOM until grant.
 */
export const META_PIXEL_BOOTSTRAP = `(function (w, d) {
  if (w.__kidsitMetaBootstrap) return;
  w.__kidsitMetaBootstrap = 1;
  var PIXEL_ID = ${JSON.stringify(META_PIXEL_ID)};
  var SRC = ${JSON.stringify(META_PIXEL_SRC)};
  var KEY = ${JSON.stringify(CONSENT_KEY)};
  var VERSION = ${CONSENT_VERSION};
  var YEAR = ${CONSENT_MAX_AGE_MS};
  var state = "idle";

  function allows(c) {
    if (!c || c.v !== VERSION || !c.ts || Date.now() - Date.parse(c.ts) > YEAR) return false;
    return !!c.analytics;
  }

  function stored() {
    try {
      return JSON.parse(w.localStorage.getItem(KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function ensureStub() {
    if (typeof w.fbq === "function") return;
    var n = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    w.fbq = n;
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
  }

  function loaderNodes() {
    var out = [];
    var nodes = d.getElementsByTagName("script");
    for (var i = 0; i < nodes.length; i++) {
      if ((nodes[i].src || "").indexOf("fbevents.js") !== -1) out.push(nodes[i]);
    }
    return out;
  }

  function inject() {
    if (loaderNodes().length) return;
    var t = d.createElement("script");
    t.async = true;
    t.src = SRC;
    var first = d.getElementsByTagName("script")[0];
    if (first && first.parentNode) first.parentNode.insertBefore(t, first);
    else (d.head || d.documentElement).appendChild(t);
  }

  function removeLoader() {
    var nodes = loaderNodes();
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
  }

  function grant() {
    ensureStub();
    w.__kidsitMetaGranted = true;
    var live = typeof w.fbq.callMethod === "function";
    if (state === "granted") return;
    if (state === "revoked" && live) {
      w.fbq("consent", "grant");
      w.fbq("track", "PageView");
      state = "granted";
      return;
    }
    if (state === "loading") return;
    if (!live) inject();
    w.fbq("init", PIXEL_ID);
    w.fbq("track", "PageView");
    state = live ? "granted" : "loading";
  }

  function revoke() {
    w.__kidsitMetaGranted = false;
    if (state === "idle" || state === "revoked") return;
    ensureStub();
    if (typeof w.fbq.callMethod === "function") {
      w.fbq("consent", "revoke");
      state = "revoked";
      return;
    }
    w.fbq.queue = [];
    removeLoader();
    state = "idle";
  }

  ensureStub();
  if (allows(stored())) grant();
  else w.__kidsitMetaGranted = false;

  w.addEventListener("kidsit-consent", function (e) {
    if (allows(e && e.detail)) grant();
    else revoke();
  });
})(window, document);
`;
