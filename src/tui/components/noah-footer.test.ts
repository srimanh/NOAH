import { test } from "node:test";
import assert from "node:assert/strict";
import { NoahFooterComponent } from "./noah-footer.js";
import { visibleLen } from "../../ui/ansi.js";

const data = (branch: string | null) => ({
  getGitBranch: () => branch,
  onBranchChange: () => () => {},
});

test("NoahFooter: shows brand, model, branch and fits width", () => {
  const c = new NoahFooterComponent(data("main"), () => "ollama/llama3.1", { dryRun: false });
  for (const w of [20, 40, 80, 120]) {
    const lines = c.render(w);
    assert.equal(lines.length, 1);
    assert.ok(visibleLen(lines[0]) <= w, `fits width ${w}`);
  }
  const full = c.render(120)[0];
  assert.match(full, /NOAH/);
  assert.match(full, /ollama\/llama3\.1/);
  assert.match(full, /main/);
  assert.match(full, /safety on/);
});

test("NoahFooter: dry-run mode is reflected", () => {
  const c = new NoahFooterComponent(data(null), () => undefined, { dryRun: true });
  assert.match(c.render(80)[0], /dry-run/);
});

test("NoahFooter: subscribes to branch changes when onChange given", () => {
  let subscribed = false;
  const d = { getGitBranch: () => "x", onBranchChange: () => { subscribed = true; return () => {}; } };
  const c = new NoahFooterComponent(d, () => "m", { dryRun: false }, () => {});
  assert.equal(subscribed, true);
  c.dispose();
});
