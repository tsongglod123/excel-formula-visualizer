# Excel Formula Visualizer — Remaining Work

## Status

- ✅ **Done:** Static UI shell — Layout, Navbar, Footer, Hero, FeatureCard, Landing page, 404, How It Works, About, global.css, astro.config.mjs, tsconfig.json, package.json
- ✅ **Done:** `src/lib/parser.ts` — recursive descent AST parser (all node types, precedence, references/ranges, error handling)
- ✅ **Done:** `src/lib/translate.ts` — plain English translator (~150 Excel functions + fallback)
- ✅ **Done:** `src/lib/parser.test.ts` — 54 tests passing
- ✅ **Done:** `src/lib/translate.test.ts` — 67 tests passing
- ✅ **Done:** `src/components/VisualTree.tsx` — React interactive visual tree with color-coded blocks, collapsible groups, hover highlighting, step-by-step mode, and reference map
- ✅ **Done:** `src/components/ExplanationPanel.tsx` — React plain English panel with full translation and per-node breakdown
- ✅ **Done:** `src/pages/visualize.astro` — Visualization page with error handling, two-column layout, and copy URL button
- ✅ **Done:** Dark mode with system-preference detection, manual toggle, and no-flash initialization
- ✅ **Done:** Minimal editorial theme with `Bricolage Grotesque` + `Spline Sans Mono`, warm amber accent, and reduced-motion support
- ✅ **Done:** In-place formula editor on `/visualize` so users can paste or edit formulas without returning home
- ✅ **Done:** New `FormulaOutline.tsx` view — a simpler, faster-to-read nested outline with an optional detailed `VisualTree` behind a tab switcher
- ✅ **Done:** Shared React wrapper `VisualizerClient.tsx` so hover and reference state sync between the visualization and explanation panels
- ✅ **Done:** Accessibility improvements — scoped keyboard shortcuts, no nested interactive controls, visible focus rings, labels, `aria-live`, and `color-scheme`
- ✅ **Done:** Vitest config updated to merge Astro's Vite config via `getViteConfig`
- ⚠️ **Fixed 8/1:** Removed stray extensionless `src/lib/parser` file (stale test copy) that shadowed `parser.ts` imports and broke Vitest

---

## Verification

- [x] `npm run test` — all tests pass (121 tests)
- [x] `npx astro check` — 0 errors, 2 pre-existing unused-variable hints in `parser.ts`
- [x] `npm run build` — builds successfully (with `@astrojs/netlify` adapter)
- [x] Visit `/visualize?formula==SUM(A1:A10)` — outline + explanation renders
- [x] Visit `/visualize?formula==IF(SUM(A1:A10)>100,"Over Budget","Within Budget")` — nested outline works
- [x] Visit `/visualize` (no formula) — in-place editor shown
- [x] Visit `/visualize?formula=hello` (no `=` prefix) — validation error shown with retry form

---

## Notes (8/1)

- Added `@astrojs/netlify` adapter so `/visualize` can be server-rendered (`prerender = false`) and read `?formula=` query params at request time. Other pages remain prerendered static.
- Removed `html2canvas` dependency and Export PNG / Print features per user request — only Copy URL sharing remains.
- Theme is stored in `localStorage` under `theme`; the layout inline script sets `data-theme` before first paint to avoid a flash.
