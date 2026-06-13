/**
 * Visual preview of every NOAH panel — wire-free.
 *   npm run build && node dist/ui/preview.js
 *   (or: npx tsx src/ui/preview.ts)
 *
 * Lets us validate the terminal experience before connecting it to live events.
 */
import * as ui from "./render.js";

const out = (s: string) => process.stdout.write(s + "\n");

out(ui.brand());

out(ui.requestPanel("install htop and then show me my five biggest files"));

out(ui.sectionHeader("PLAN", "info"));
out(
  ui.barLines(
    [
      "1. Inspect the largest files in the home directory (read-only)",
      "2. Install htop via the native package manager",
      "3. Report results",
    ].join("\n"),
  ),
);

out(ui.toolCard("bash", "du -ah ~ | sort -rh | head -5", "running"));
out(
  ui.toolCard("bash", "du -ah ~ | sort -rh | head -5", "success", [
    "1.2G  ~/Movies/demo.mov",
    "480M  ~/Downloads/node-v22.pkg",
    "120M  ~/Projects/NOAH/node_modules",
  ]),
);

out(ui.toolCard("package", "install htop", "running"));

out(ui.safetyReview("sudo apt-get install -y htop", "package install", "bash"));
out(ui.approvePrompt() + "y");

out(ui.safetyBlock("rm -rf / --no-preserve-root", "blocked: recursive delete of root/home"));
out(ui.safetyBlock(":(){ :|:& };:", "blocked: fork bomb"));

out("");
out(ui.auditLine("bash", "du -ah ~ | sort -rh | head -5", true));
out(ui.auditLine("package", "install htop", true));
out(ui.auditLine("bash", "cat /missing", false));

out(ui.resultPanel("Installed htop. Your five largest files are listed above; ~/Movies/demo.mov (1.2G) is the biggest."));

out("\n  " + "\x1b[1m\x1b[97m— check verdicts —\x1b[0m");
out(ui.checkVerdict("ls -la", "allow", "read-only / safe command"));
out(ui.checkVerdict("sudo apt install nginx", "confirm", "potentially destructive command"));

out("");
