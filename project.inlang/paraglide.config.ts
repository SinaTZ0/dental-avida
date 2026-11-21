import { defineConfig } from "@inlang/paraglide-js";

/*===== Paraglide =====*/
// Read by every compile: the Vite plugin (dev, build, Storybook), Vitest and `pnpm i18n:compile` (docs/frontend/i18n.md).
export default defineConfig({
  outdir: "./src/paraglide",
  // Typed declarations for the generated JavaScript, so `tsc` checks message names and parameters.
  emitTsDeclarations: true,
  // One module per locale, the layout `pnpm i18n:compile` writes too. Paraglide 3's Vite default keeps the messages in
  // virtual modules, which its CLI can't write: a typecheck would then rewrite this folder under a running dev server.
  // The production build overrides this in `vite.config.ts`.
  outputStructure: "locale-modules",

  /*------ Locale Resolution ------*/
  // Page URLs are independent of cookies and Accept-Language.
  strategy: ["url", "baseLocale"],
  // Persian uses unprefixed paths. The root rule comes first because the first matching pattern wins.
  urlPatterns: [
    {
      pattern: "/",
      localized: [["fa", "/"]],
    },
    {
      pattern: "/:path(.*)?",
      localized: [["fa", "/:path(.*)?"]],
    },
  ],
  routeStrategies: [
    // API calls carry no locale in their path. The browser's client sends the page's locale in a header
    // (`src/orpc/client.ts`), read by `custom-locale-header` (`src/lib/locale.server.ts`).
    { match: "/rpc/:path(.*)?", strategy: ["custom-locale-header", "baseLocale"] },
    // Machine endpoints: never redirected or prefixed.
    { match: "/api/:path(.*)?", exclude: true },
    { match: "/healthz", exclude: true },
    { match: "/robots.txt", exclude: true },
    { match: "/sitemap.xml", exclude: true },
  ],
});
