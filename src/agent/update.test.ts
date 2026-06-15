import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  compareSemver,
  isNewer,
  shouldCheck,
  formatUpdateBanner,
  fetchLatestVersion,
  checkForUpdate,
  DAY_MS,
} from "./update.js";

const cfg = () => join(mkdtempSync(join(tmpdir(), "noah-upd-")), "config.json");

test("compareSemver: orders versions correctly", () => {
  assert.equal(compareSemver("0.2.3", "0.2.4"), -1);
  assert.equal(compareSemver("0.3.0", "0.2.9"), 1);
  assert.equal(compareSemver("1.0.0", "0.9.9"), 1);
  assert.equal(compareSemver("0.2.3", "0.2.3"), 0);
  assert.equal(compareSemver("0.2.10", "0.2.9"), 1, "numeric, not lexicographic");
});

test("compareSemver: tolerates v-prefix and prerelease", () => {
  assert.equal(compareSemver("v0.2.4", "0.2.3"), 1);
  assert.equal(compareSemver("0.2.4-beta.1", "0.2.3"), 1);
});

test("isNewer: only true when latest > current", () => {
  assert.equal(isNewer("0.2.4", "0.2.3"), true);
  assert.equal(isNewer("0.2.3", "0.2.3"), false);
  assert.equal(isNewer("0.2.2", "0.2.3"), false);
  assert.equal(isNewer("garbage", "0.2.3"), false, "bad input never nags");
});

test("shouldCheck: respects the interval", () => {
  const now = 1_000_000_000_000;
  assert.equal(shouldCheck(now, undefined), true, "never checked → check");
  assert.equal(shouldCheck(now, now - DAY_MS - 1), true, "stale → check");
  assert.equal(shouldCheck(now, now - 1000), false, "recent → skip");
});

test("formatUpdateBanner: shows both versions and the command", () => {
  const b = formatUpdateBanner("0.2.3", "0.3.0");
  assert.match(b, /0\.2\.3/);
  assert.match(b, /0\.3\.0/);
  assert.match(b, /noah update/);
});

test("fetchLatestVersion: parses the npm registry response", async () => {
  const fakeFetch = async () =>
    ({ ok: true, json: async () => ({ version: "0.9.1" }) }) as unknown as Response;
  assert.equal(await fetchLatestVersion("noah-agent", fakeFetch), "0.9.1");
});

test("fetchLatestVersion: network failure → null (never throws)", async () => {
  const boom = async () => {
    throw new Error("offline");
  };
  assert.equal(await fetchLatestVersion("noah-agent", boom), null);
});

test("checkForUpdate: fetches, caches, and reports an available update", async () => {
  const p = cfg();
  const now = 2_000_000_000_000;
  const fakeFetch = async () =>
    ({ ok: true, json: async () => ({ version: "0.3.0" }) }) as unknown as Response;

  const info = await checkForUpdate({ current: "0.2.3", now, configPath: p, fetchImpl: fakeFetch });
  assert.ok(info);
  assert.equal(info!.latest, "0.3.0");
  assert.match(info!.banner, /noah update/);
});

test("checkForUpdate: within interval uses cache and makes no network call", async () => {
  const p = cfg();
  const now = 3_000_000_000_000;
  let calls = 0;
  const counting = async () => {
    calls++;
    return { ok: true, json: async () => ({ version: "0.5.0" }) } as unknown as Response;
  };
  // first call populates cache + counts 1
  await checkForUpdate({ current: "0.2.3", now, configPath: p, fetchImpl: counting });
  assert.equal(calls, 1);
  // immediate second call → cached, no new fetch, still reports update
  const info = await checkForUpdate({ current: "0.2.3", now: now + 5, configPath: p, fetchImpl: counting });
  assert.equal(calls, 1, "no second network call within interval");
  assert.equal(info!.latest, "0.5.0", "served from cache");
});

test("checkForUpdate: up-to-date → null", async () => {
  const p = cfg();
  const fakeFetch = async () =>
    ({ ok: true, json: async () => ({ version: "0.2.3" }) }) as unknown as Response;
  const info = await checkForUpdate({ current: "0.2.3", now: Date.now(), configPath: p, fetchImpl: fakeFetch });
  assert.equal(info, null);
});
