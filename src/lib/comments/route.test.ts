import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../../app/api/comments/route";

// No DATABASE_URL here, so a valid request returns an empty list without touching storage.
async function get(qs: string) {
  const saved = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const res = await GET(new Request(`http://localhost/api/comments?${qs}`));
    return { status: res.status, json: await res.json(), cache: res.headers.get("cache-control") };
  } finally {
    if (saved !== undefined) process.env.DATABASE_URL = saved;
  }
}

test("comments route: rejects an unknown language or a malformed slug", async () => {
  assert.equal((await get("lang=fr&slug=milchamot-shena")).status, 400);
  assert.equal((await get("lang=he&slug=../etc")).status, 400);
  assert.equal((await get("lang=he")).status, 400);
});

test("comments route: a valid post with no storage gives an empty, CDN-cacheable list", async () => {
  const r = await get("lang=he&slug=milchamot-shena");
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { comments: [] });
  assert.match(r.cache ?? "", /s-maxage=60/);
});
