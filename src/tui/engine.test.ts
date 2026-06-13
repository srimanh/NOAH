import { test } from "node:test";
import assert from "node:assert/strict";
import { Container, TUI, ProcessTerminal } from "@earendil-works/pi-tui";
import { RequestPanelComponent } from "./components/request-panel.js";
import { visibleLen } from "../ui/ansi.js";

test("T1 spike: pi-tui engine classes are available", () => {
  assert.equal(typeof Container, "function");
  assert.equal(typeof TUI, "function");
  assert.equal(typeof ProcessTerminal, "function");
});

test("T1 spike: a NOAH component composes inside Pi's Container", () => {
  const root = new Container();
  root.addChild(new RequestPanelComponent("install htop and tidy my downloads"));
  const lines = root.render(80);
  assert.ok(lines.length >= 3, "container renders the child panel");
  for (const line of lines) {
    assert.ok(visibleLen(line) <= 80, `line exceeds width: ${JSON.stringify(line)}`);
  }
  assert.match(lines.join("\n"), /REQUEST/);
});
