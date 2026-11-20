import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

// Regression: on pages without <MotionRoot> (blog, posts, legal) the mobile menu opened at opacity 0 and stayed there,
// leaving an empty gap under the header. Any component that uses `m.*` must be inside a LazyMotion provider.
const root = new URL("../", import.meta.url).pathname;
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx$/.test(p) ? [p] : [];
  });
const src = (p: string) => readFileSync(p, "utf8");

test("Navbar provides its own MotionRoot, so it animates on every page that renders it", () => {
  const nav = src(join(root, "components/navbar.tsx"));
  assert.match(nav, /import \{ m, MotionRoot, spring \} from "\.\/motion"/);
  assert.match(nav, /export function Navbar\(props[^)]*\)[^{]*\{\s*return \(\s*<MotionRoot>\s*<NavbarInner \{\.\.\.props\} \/>\s*<\/MotionRoot>/);
});

test("every page that renders <Navbar> gets the same menu behaviour (Navbar is the only motion user outside the home page)", () => {
  const users = files(root).filter((p) => /\bm\.(a|ul|div|li|span|button)\b/.test(src(p)) && !p.endsWith("components/motion.tsx"));
  const outsideHome = users.filter((p) => !/components\/(hero|summary|showcase|faq|features|social-proof|pricing)\.tsx$/.test(p));
  assert.deepEqual(outsideHome.map((p) => p.slice(root.length)), ["components/navbar.tsx"]);
  const renderers = files(join(root, "app")).concat(files(join(root, "components"))).filter((p) => /<Navbar\b/.test(src(p)));
  assert.ok(renderers.length >= 4, "home, blog index, blog post and legal pages render the Navbar");
});

test("the mobile menu does not hide itself without JS animation: opacity is animated, never the only way to show it", () => {
  const nav = src(join(root, "components/navbar.tsx"));
  assert.match(nav, /animate=\{\{ opacity: 1, y: 0 \}\}/);
  assert.match(nav, /<header className="sticky top-3 z-50/);
});
