/**
 * Visual eyeball of NOAH TUI components composed inside a pi-tui Container.
 *   npm run build && node dist/tui/preview.js
 * Renders statically (no render loop) so we can review the layout.
 */
import { Container } from "@earendil-works/pi-tui";
import { HeaderComponent } from "./components/header.js";
import { RequestPanelComponent } from "./components/request-panel.js";
import { ThinkingViewComponent } from "./components/thinking-view.js";
import { ToolCardComponent } from "./components/tool-card.js";
import { SafetyReviewComponent } from "./components/safety-review.js";
import { SafetyBlockComponent } from "./components/safety-block.js";
import { AuditLineComponent } from "./components/audit-line.js";
import { ResponseViewComponent } from "./components/response-view.js";

const WIDTH = Number(process.env.WIDTH ?? 72);

const think = new ThinkingViewComponent();
think.append("The user wants htop installed. I'll inspect disk first, then install via brew.");
const resp = new ResponseViewComponent();
resp.append("Installed **htop**. Your largest file is `demo.mov` (1.2G).");

const root = new Container();
for (const c of [
  new HeaderComponent(),
  new RequestPanelComponent("install htop and show my biggest files"),
  think,
  new ToolCardComponent("bash", "du -ah ~ | sort -rh | head -5", "success", ["1.2G  ~/Movies/demo.mov"]),
  new SafetyReviewComponent("sudo apt-get install -y htop", "package install", "bash"),
  new AuditLineComponent("bash", "du -ah ~ | sort -rh | head -5", true),
  new SafetyBlockComponent("rm -rf / --no-preserve-root", "blocked: recursive delete of root/home"),
  resp,
]) {
  root.addChild(c);
}

process.stdout.write(root.render(WIDTH).join("\n") + "\n");
