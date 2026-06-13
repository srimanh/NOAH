/**
 * NOAH footer — a branded status line for the interactive TUI.
 *
 * Shows: NOAH wordmark · safety mode · current model · git branch.
 * Git branch is live (FooterDataProvider.onBranchChange). The model is read
 * from a getter each render so Ctrl+P model cycling stays accurate.
 */
import type { Component } from "@earendil-works/pi-tui";
import { bold, dim, gray, green, yellow, cyan, truncate, UNICODE } from "../../ui/ansi.js";

export interface ReadonlyFooterData {
  getGitBranch(): string | null;
  onBranchChange(cb: () => void): () => void;
}

const SEP = UNICODE ? " · " : " | ";
const BRANCH = UNICODE ? "⎇ " : "git:";

export class NoahFooterComponent implements Component {
  private unsubscribe?: () => void;

  constructor(
    private readonly footerData: ReadonlyFooterData,
    private readonly getModel: () => string | undefined,
    private readonly opts: { dryRun: boolean },
    onChange?: () => void,
  ) {
    if (onChange) this.unsubscribe = footerData.onBranchChange(onChange);
  }

  render(width: number): string[] {
    const brand = bold(green("NOAH"));
    const safety = this.opts.dryRun ? yellow("dry-run") : green("safety on");
    const model = this.getModel();
    const branch = this.footerData.getGitBranch();

    const parts = [brand, safety];
    if (model) parts.push(cyan(model));
    if (branch && branch !== "detached") parts.push(dim(`${BRANCH}${branch}`));

    const line = parts.join(gray(SEP));
    return [truncate(line, width)];
  }

  invalidate(): void {}

  dispose(): void {
    this.unsubscribe?.();
  }
}
