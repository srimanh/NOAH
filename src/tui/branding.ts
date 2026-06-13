/**
 * NOAH branding extension — replaces Pi's header/footer/title in the TUI with
 * NOAH's identity. UI-only: it no-ops when there is no dialog-capable UI
 * (print/rpc-less), so plain-CLI and tests are unaffected.
 */
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { HeaderComponent } from "./components/header.js";
import { NoahFooterComponent } from "./components/noah-footer.js";

export interface BrandingOptions {
  dryRun: boolean;
}

export const noahBranding =
  (opts: BrandingOptions) =>
  (pi: ExtensionAPI): void => {
    const apply = (ctx: ExtensionContext) => {
      if (!ctx.hasUI) return;

      ctx.ui.setTitle("NOAH");
      ctx.ui.setHeader(() => new HeaderComponent());
      ctx.ui.setFooter((tui, _theme, footerData) =>
        new NoahFooterComponent(
          footerData,
          () => ctx.model?.id,
          { dryRun: opts.dryRun },
          () => tui.requestRender(),
        ),
      );
    };

    // session_start fires for the initial session and every /new, /resume, /fork,
    // so branding survives session replacement.
    pi.on("session_start", (_event, ctx) => apply(ctx));
  };
