import { test } from "node:test";
import assert from "node:assert/strict";
import { visibleLen } from "../../ui/ansi.js";
import { HeaderComponent } from "./header.js";
import { ToolCardComponent } from "./tool-card.js";
import { SafetyReviewComponent } from "./safety-review.js";
import { SafetyBlockComponent } from "./safety-block.js";
import { AuditLineComponent } from "./audit-line.js";
import { ThinkingViewComponent } from "./thinking-view.js";
import { ResponseViewComponent } from "./response-view.js";

const WIDTHS = [24, 40, 64, 100, 120];

function assertFits(lines: string[], width: number): void {
  assert.ok(Array.isArray(lines), "render returns array");
  for (const l of lines) {
    assert.ok(visibleLen(l) <= width, `width ${width}: ${JSON.stringify(l)} (${visibleLen(l)})`);
  }
}

test("all components honor the line ≤ width invariant", () => {
  const make = () => {
    const t = new ThinkingViewComponent();
    t.append("weighing whether deleting the largest files on disk is safe enough to proceed");
    const r = new ResponseViewComponent();
    r.append("Installed **htop**. The biggest file is `demo.mov` at 1.2G.");
    return [
      new HeaderComponent(),
      new ToolCardComponent("bash", "du -ah ~ | sort -rh | head", "running"),
      new SafetyReviewComponent("sudo apt-get install -y nginx", "package install", "bash"),
      new SafetyBlockComponent("rm -rf / --no-preserve-root", "blocked: recursive delete of root/home"),
      new AuditLineComponent("bash", "du -ah ~ | sort -rh | head", true),
      t,
      r,
    ];
  };
  for (const c of make()) {
    for (const w of WIDTHS) assertFits(c.render(w), w);
    assert.equal(typeof c.invalidate, "function");
  }
});

test("ToolCard reflects status and command", () => {
  const c = new ToolCardComponent("bash", "du -sh *", "running");
  let j = c.render(80).join("\n");
  assert.match(j, /TOOL/);
  assert.match(j, /RUNNING/);
  assert.match(j, /du -sh/);
  c.setStatus("success");
  assert.match(c.render(80).join("\n"), /SUCCESS/);
});

test("SafetyBlock is the centerpiece: BLOCKED + command", () => {
  const j = new SafetyBlockComponent("rm -rf /", "blocked: recursive delete of root/home").render(80).join("\n");
  assert.match(j, /SAFETY BLOCK/);
  assert.match(j, /BLOCKED/);
  assert.match(j, /rm -rf \//);
});

test("SafetyReview shows command and review heading", () => {
  const j = new SafetyReviewComponent("sudo apt install nginx", "package install", "bash").render(80).join("\n");
  assert.match(j, /SAFETY REVIEW/);
  assert.match(j, /sudo apt install nginx/);
});

test("ThinkingView accumulates streamed deltas", () => {
  const t = new ThinkingViewComponent();
  t.append("first ");
  t.append("second");
  const j = t.render(80).join("\n");
  assert.match(j, /THINKING/);
  assert.match(j, /first second/);
});

test("ResponseView accumulates streamed deltas", () => {
  const r = new ResponseViewComponent();
  r.append("hello ");
  r.append("world");
  assert.match(r.render(80).join("\n"), /hello world/);
});

test("AuditLine differs for ok vs error", () => {
  const ok = new AuditLineComponent("bash", "ls", true).render(80).join("\n");
  const bad = new AuditLineComponent("bash", "cat x", false).render(80).join("\n");
  assert.match(ok, /AUDIT/);
  assert.match(ok, /bash/);
  assert.notEqual(ok, bad);
});
