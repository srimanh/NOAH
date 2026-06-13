import { test } from "node:test";
import assert from "node:assert/strict";
import {
  heroLogo,
  Splash,
  UserBlock,
  AssistantBlock,
  ToolBlock,
  SystemBlock,
  InputBox,
  Footer,
  Palette,
  Selector,
} from "./components.js";
import { visibleLen, stripAnsi } from "../../ui/ansi.js";

const fits = (lines: string[], w: number) => lines.every((l) => visibleLen(l) <= w);
const fakeInput = { render: () => ["\x1b_pi:c\x07"], invalidate() {} } as any;

test("heroLogo: big centered NOAH wordmark + full-name tagline within width", () => {
  const lines = heroLogo(80);
  assert.match(lines.join("\n"), /█|N O A H/);
  assert.match(lines.join("\n"), /Native Operating-system Agentic Harness/);
  assert.doesNotMatch(lines.join("\n"), /AGENTIC OPERATING SYSTEM|A G E N T I C/);
  assert.ok(fits(lines, 80));
});

test("heroLogo: tagline degrades gracefully on a narrow terminal", () => {
  const lines = heroLogo(30);
  assert.match(lines.join("\n"), /N O A H|NOAH/);
  assert.ok(fits(lines, 30));
});

test("Splash: shows tips on a fresh session, hides them otherwise", () => {
  assert.match(new Splash(() => true).render(90).join("\n"), /install software/);
  assert.doesNotMatch(new Splash(() => false).render(90).join("\n"), /install software/);
});

test("AssistantBlock: renders markdown clean (no artifacts) and fits width", () => {
  const a = new AssistantBlock();
  a.append("## Plan\n- install **docker**\n- run `docker run hello`");
  assert.equal(a.value, "## Plan\n- install **docker**\n- run `docker run hello`");
  const txt = stripAnsi(a.render(60).join("\n"));
  assert.match(txt, /Plan/);
  assert.match(txt, /docker/);
  assert.doesNotMatch(txt, /\*\*|`|^#/m, "no markdown artifacts");
  for (const w of [28, 60]) assert.ok(fits(a.render(w), w), `fits ${w}`);
});

test("ToolBlock transitions; UserBlock/SystemBlock fit narrow", () => {
  const t = new ToolBlock("package", "install htop", "running");
  assert.match(t.render(60).join(""), /running/);
  t.set("ok");
  assert.match(t.render(60).join(""), /done/);
  assert.ok(fits(new UserBlock("install docker").render(28), 28));
  assert.ok(fits(new SystemBlock(["a wrapping system note here"]).render(28), 28));
});

test("InputBox + Footer fit width and frame the prompt", () => {
  const box = new InputBox(fakeInput, () => ({ busy: false }));
  const lines = box.render(60);
  assert.equal(lines.length, 3, "rounded box: top/mid/bottom");
  assert.ok(fits(lines, 60));
  const f = new Footer(() => ({ model: "ollama/llama3.1", safety: "on", busy: false }));
  assert.match(f.render(80)[0], /ollama\/llama3\.1/);
  assert.ok(visibleLen(f.render(80)[0]) <= 80);
});

test("Palette navigates and reports selection", () => {
  const p = new Palette();
  assert.deepEqual(p.render(80), []);
  p.set([
    { name: "help", desc: "x" },
    { name: "model", desc: "y" },
  ]);
  p.visible = true;
  assert.ok(p.render(80).length > 0);
  assert.equal(p.current()?.name, "help");
  p.move(1);
  assert.equal(p.current()?.name, "model");
});

test("Selector: navigates, clamps, returns current item, fits width", () => {
  const items = Array.from({ length: 20 }, (_, i) => ({ id: `m${i}`, label: `p/m${i}` }));
  const s = new Selector("select model", items);
  assert.equal(s.current()?.id, "m0");
  s.move(1);
  s.move(1);
  assert.equal(s.current()?.id, "m2");
  s.move(-100);
  assert.equal(s.current()?.id, "m0", "clamps at top");
  assert.ok(fits(s.render(70), 70));
  assert.match(s.render(70).join("\n"), /SELECT MODEL/);
});
