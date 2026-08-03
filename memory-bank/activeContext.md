# Active Context — Excel Formula Visualizer

## Current Focus

The project is in an **active development** phase. All three core layers (Parse, Visualize, Explain) are implemented and functional with 121 passing tests. Current focus is on **visualization polish** and **UX enhancements**.

## Recent Changes

### Completed: Fixed ARIA Audit Warning on the Tree (aria-selected)

- Astro's dev-toolbar audit flagged "Missing attributes required for ARIA role" on the formula tree. Root cause: `role="treeitem"` requires `aria-selected` (per `aria-query`'s roles map — `treeitem.requiredProps = { 'aria-selected': null }`). Added `aria-selected="false"` to all 7 `<li role="treeitem">` sites in `FormulaOutline.tsx` (function/operator/literal/reference/parenthetical rows + compact leaf rows). Since this tree isn't keyboard-selectable, every item is `false` (per WAI-ARIA, omit-state is not valid for treeitem). Added a regression test locking in that every treeitem has `aria-selected="false"`. Test count 181 → 182.

### Completed: Function-Help Popover (tap-first, full coverage)

- **New `src/lib/functionDocs/`** — a full Excel function reference: ~200 short summaries + returns (one plain sentence each, ≤100 chars, office-worker friendly). `functionDocs.ts` holds the data; `index.ts` exposes `getFunctionDoc(name)` + `syntaxFor(name)`. Syntax is auto-generated from `FUNCTION_ARG_NAMES`, **always starts with `=`** (like Excel), and **optional arguments render in square brackets** via `FUNCTION_OPTIONAL_ARGS` (e.g. `=IFS(logical_test1, value_if_true1, [logical_test2], [value_if_true2], …)`; variadic lists collapse to `=SUM(number1, [number2], [number3], …)`; `FUNCTION_VARIADIC` adds the ellipsis for short variadic functions like IFS/SUMIFS/CHOOSE; overrides for IF/VLOOKUP/LET). Every function links to its official Microsoft support page: `https://support.microsoft.com/en-us/excel/functions/{func-name}-function` (lowercase, dots → hyphens, e.g. `STDEV.S` → `stdev-s-function`).
- **FULL-COVERAGE INVARIANT** — `functionDocs.test.ts` iterates every key of `FUNCTION_ARG_NAMES` and asserts a non-blank summary + returns exist (plus length caps), so a future function can't be added without tooltip data. Also covers everyday special-cased functions (LET, IFS, SUMIFS, COUNTIFS, AVERAGEIFS, MINIFS, MAXIFS, CHOOSE) with their own syntax args.
- **Popover in `FormulaOutline.tsx`** — function names are now `<button>`s (`.fn-trigger`) with `aria-haspopup`/`aria-expanded`/`aria-controls`. Opens tap-first (click → pinned) and on hover (300ms intent delay). Shows name, summary, syntax, returns, and a "Learn more on Microsoft Support" link (opens the official support page). Closes on Esc, click/tap outside, scroll, or zoom. Positioned `position:fixed` (escapes the zoomed/scrolling canvas) with bottom-edge flip; `touch-action: manipulation` + `-webkit-tap-highlight-color: transparent` on the trigger for iOS. Uses a React context (`FunctionDocContext`) so no props need threading through the recursive tree.
- **Accessibility** — proper `<button>` trigger (no div/span anti-pattern), keyboard focusable, `focus-visible` rings, `aria-expanded`/`aria-controls` pattern, reduced-motion respected via the global CSS override.
- Test count 167 → 181 (+9 functionDocs, +4 popover, +1 optional-brackets). All green + astro check 0 errors + build Complete + live SSR: `fn-trigger`, `aria-haspopup`, `doc-popover` all present in served page.

### Completed: Editor Bar Polish (Icons + Equal Sizes)

- **Update button icon** — `FormulaEditor` gained an `icon?: 'search' | 'refresh'` prop (default `'search'` keeps the landing page's magnifying glass); `visualize.astro` passes `icon="refresh"` (Heroicons arrow-path) so Update reads as "refresh the result".
- **Copy URL → icon-only button** — `CopyUrlButton` is now a square icon button (`p-3` + `h-5 w-5` link icon → 46px tall, exactly matching Update's `py-3 text-sm` height). Feedback on copy: icon swaps to a green check + `aria-label`/`title` become "Copied" for 2s, with an sr-only `aria-live` status span for screen readers. Still wired via `astro:page-load` (per the ClientRouter scripting pattern).

### Completed: Dropped Redundant "Current Formula" Section

- **visualize.astro slimmed to an editor bar** — the read-only "Current Formula" display duplicated the formula that already appears in the FormulaEditor input AND the EvaluatorBar's fx formula bar (triple redundancy). The section is now a compact `p-4` bar: FormulaEditor (Update) flex-1 + CopyUrlButton. Also removed a duplicate sr-only `<label>` (the editor component already ships its own) and added an sr-only `<h1>Visualize formula</h1>` so the page keeps a heading for screen readers after the visible h1 was removed.

### Completed: Tree Visual Redesign (File-Explorer Style)

- **Nested cards → connector-line tree** — `FormulaOutline`'s `OutlineNode` rewritten from box-in-box cards to one row per node with file-explorer connector guides (`.tree-row` / `.tree-children` CSS in `global.css`: per-row vertical segment + horizontal tick, `:last-child` stops at the tick). ARIA upgraded to the tree pattern (`role="tree"/"treeitem"/"group"`); arg labels became small uppercase chips at the start of child rows; dim/completed opacity moved to the `<li>` so subtrees fade as a unit. Compact leaf pills, step chips, hover/selection rings, fill handle, and zoom controls all preserved. Tests: 2 role queries updated `group` → `treeitem` in FormulaOutline + VisualizerClient tests. 167/167 green, check/build clean, live SSR verified (tree role, 4 treeitems, connectors, arg labels).

### Completed: Canvas Zoom Controls

- **Excel status-bar zoom cluster** — `FormulaOutline` gained a slim footer with `−` / `%` (click to reset to 100%) / `+` / `Fit` buttons (25%–200%, 25% steps). For long formulas that overflow the panel, `Fit` scales the tree so its full width fits the viewport (snapped to 5%). Mechanism: `transform: scale()` on a `w-max` wrapper + explicit-size spacer for honest scrollbars + guarded `ResizeObserver` measurement. Two new tests (zoom behavior incl. actual transform assertion, min-zoom disable + Fit no-op safety in jsdom); two pre-existing tests needed `getByRole('button')` → `{ name: 'B2' }` scoping once zoom buttons existed. Test count 165 → 167.

### Completed: Excel-Native Visual Identity

- **Brand accent → Excel green** — `global.css` tokens: `--color-accent: #107c41` (modern M365 green), hover `#0b5a30`, subtle `#ebf7ee`. Every accent consumer (nav, links, buttons, focus rings, Play button, current-step callout) flips via the token — no per-file color edits needed.
- **Excel formula bar** — `EvaluatorBar` formula display restyled as Excel's formula bar: boxed italic `fx` glyph + white strip in the office font; `FormulaSpan` leaves no longer force `font-mono`.
- **Worksheet canvas** — `FormulaOutline` restructured into a card with a slim toolbar header ("Formula structure" label + color legend docked right) on a plain white canvas. (A gridline backdrop was shipped then removed same-day — users found it noisy/distracting behind dense trees.)
- **Active-cell selection** — selected references now get Excel's active-cell look (`ring-2 ring-accent` + `FillHandle` square) on BOTH compact pills and leaf cards; `selectedReference` threaded through `CompactSubtree` (previously selection was invisible on compact pills — a real UX gap since most references render compact). Ancestor cards get `ring-1 ring-accent`. Step badges became filled green chips.
- **Office font** — new `--font-family-office` token (`font-office` utility, Segoe UI on Windows) applied at the `VisualizerClient` root so the functional UI reads like an Office app; Bricolage Grotesque stays for site brand/headings.
- Test count 164 → 165 (new active-cell selection test). All green + astro check clean + build clean + live SSR smoke verified (fx, grid, font-office, green chips all present).

### Completed: Visualizer Layout Redesign + Scrollable Explanation

- **Full-width outline** — After the breakdown removal left the right column sparse, `VisualizerClient` changed from one `lg:grid-cols-2` grid (visual left / explanation right) to a stacked layout: EvaluatorBar + Full Explanation side-by-side in a top row (both compact), `FormulaOutline` full container width below. The outline is the panel that needs room on dense formulas.
- **Scrollable Full Explanation** — translation paragraph capped at `max-h-64 overflow-y-auto pr-2` so very long LET formulas stay readable instead of pushing the visualization far down the page. Test count 163 → 164.

### Completed: Step-by-Step Breakdown Removed (Simplicity)

- **ExplanationPanel simplified to full-explanation-only** — Removed the "Step-by-Step Breakdown" tree card (nested per-node hoverable translation lines), `TranslationNode` sub-component, and `dedupeChildren()` helper. Rationale: for the target audience (non-technical office workers), the breakdown duplicated what the EvaluatorBar's current-step display and the Full Explanation sentence already provide; it added scanning noise, especially on long formulas. Props slimmed to `{ translation }` only; `VisualizerClient` no longer passes `nodeTranslations`/`highlightedNodeId`/`onHoverNode` to it (EvaluatorBar still receives `nodeTranslations` for current-step descriptions). Test count 166 → 163.

### Completed: React Component Tests

- **Testing infrastructure** — Installed jsdom v30.0.1, @testing-library/react v16.3.2 (+ dom peer v10.4.1, user-event v14.6.1, jest-dom v7.0.0). `vitest.config.mts` keeps `environment: 'node'` default + `setupFiles: ['./src/test/setup.ts']`; component tests opt into jsdom via `// @vitest-environment jsdom` docblock pragma (Vitest 4 removed environmentMatchGlobs). setup.ts registers jest-dom matchers AND manual `cleanup()` (required because `globals: false` disables RTL auto-cleanup).
- **27 new tests (166 total)** — VisualizerClient (plain-object AST island regression test), FormulaOutline, EvaluatorBar, ExplanationPanel, useEvaluation hook (fake timers for auto-play).
- Component tests deliberately pass `JSON.parse(JSON.stringify(ast))` plain objects to mirror the post-serialization shape components receive in production; lib tests keep using class instances.

### Completed: Bug Fixes (Preview + View Transitions)

- **astro preview unsupported** — `npm run preview` now runs `netlify serve` (netlify-cli v27.0.1 added as devDependency; `netlify.toml` created with `command = "npm run build"`, `publish = "dist"`). Root cause: `@astrojs/netlify` ships no preview entrypoint, so Astro core throws. Validated `/` (static) and `/visualize` (SSR function) both return 200 via the local Netlify server.
- **Blank visualizer after submitting a formula (AST island serialization)** — The OOP AST uses class instances whose `type`/`getChildren()`/`getLabel()` live on the prototype. When `visualize.astro` passed the AST to `<VisualizerClient client:load>`, Astro serialized it via `Object.entries` into a plain object, so on hydration the client AST had data but no methods — `useEvaluation` threw `getChildren is not a function` and the island went blank. Fix: added `ASTNodeObject` shape type, a `fromObject` factory per node, `ASTTraverser.deserializeAST`, and a memoized revival in `VisualizerClient`. 5 new round-trip tests.
- **Mobile hamburger menu broken after navigation** — Replaced `is:inline` one-shot scripts with bundled module scripts wired via `astro:page-load` in `Navbar.astro`, `CopyUrlButton.astro`, and `FormulaEditor.astro`. Root cause: ClientRouter deduplicates inline scripts by textContent, so identical scripts never re-ran after client-side swaps, leaving fresh DOM with no listeners.

### Completed: OOP Refactoring

- **AST class hierarchy** — Replaced plain interfaces with polymorphic classes (`ASTNode` abstract base + 5 concrete node classes) in `src/lib/ast/`
  - Each node encapsulates `getChildren()`, `getLabel()`, `isLeaf()` behavior
  - Eliminated all `switch (node.type)` + cast patterns in consumers
- **ASTTraverser** — New static utility class in `src/lib/ast/ASTTraverser.ts`
  - `findNode()`, `getSubtreeIds()`, `getParentMap()`, `getAncestors()`, `subtreeHasReference()`, `computeEvaluationOrder()`, `computeEvaluationStepMap()`
  - 13 new unit tests
- **Parser split** — `src/lib/parser.ts` monolith (585 lines) split into:
  - `Tokenizer.ts` — token types, patterns, tokenize()
  - `Parser.ts` — recursive descent parser + public `parse()` API
  - `FormulaError.ts` — error class
- **Translator strategy registry** — `src/lib/translate.ts` monolith (740 lines) split into 11 category modules + registry:
  - `logical`, `math`, `lookup`, `text`, `date`, `statistical`, `information`, `financial`, `engineering`, `database`, `array`
  - `TranslationContext.ts` provides shared helpers
- **Function args split** — `src/lib/functionArgs.ts` (280 lines) split into `index.ts` (public API) + `functionArgs.ts` (data)
- **Component organization** — Split into `src/components/astro/` and `src/components/react/`
- **`useEvaluation` hook** — Extracted play/pause/step/reset state logic from `VisualizerClient` into `src/components/react/hooks/useEvaluation.ts`
- **Backward-compat re-exports** — `parser.ts`, `translate.ts`, `functionArgs.ts` at `src/lib/` root re-export from new directories

## In Progress

- [ ] **Collapsible groups** in `FormulaOutline` — Expand/collapse functions and parenthetical expressions for large formulas

## Next Steps (Priority Order)

1. Implement collapsible groups in `FormulaOutline` component
2. Add visual connection lines between related cell references in the reference map
3. Add tooltips with reference details (range info, value if available)
4. Consider keyboard shortcuts for step-by-step mode (arrow keys, space for play/pause)
5. Add formula history / recent formulas feature
6. Add end-to-end tests with Playwright (real browser, island hydration)

## Active Decisions & Considerations

- **Collapsible groups approach**: Should use React state (`useState` for expanded/collapsed tracking) with smooth CSS transitions. Consider whether to persist collapse state across re-renders.
- **Reference connection lines**: Needs careful implementation — SVG overlay or canvas-based approach. Must work with responsive layout (site is light-only; no dark mode).
- **Tooltip positioning**: Use floating UI or Popper.js for smart positioning that avoids viewport edge clipping.
- **Keyboard shortcuts**: Need to scope shortcuts to the evaluator component only (not global) to avoid conflicts with browser defaults.

## Important Patterns & Preferences

- React components use `'use client'` directive since they need client-side interactivity
- Components are hydrated with `client:load` on the visualize page (they're immediately visible)
- All props to React components must be serializable (no functions or complex objects passed from Astro)
- AST data flows from Astro server-side render → serialized as JSON → passed to React client components via props
- The `/visualize` page uses on-demand rendering (`prerender = false`) with `@astrojs/netlify` adapter
- Color mapping is consistent: Functions (blue/purple), Operators (amber), References (violet), Literals (green), Parentheses (gray)

## Learnings & Insights

- The recursive descent parser handles significant complexity — operator precedence, unary minus, percent operator, nested functions, 3D references
- The translator's hierarchical approach (translating child nodes first, then embedding into parent) produces natural-sounding output
- React's `useMemo` and `useCallback` are important for performance when handling deeply nested ASTs with many nodes
- Tailwind CSS v4's `@theme` directive in `global.css` eliminates the need for a `tailwind.config.js` file
- The `@astrojs/netlify` adapter enables on-demand rendering for specific routes while keeping the rest of the site static
- Vitest 4 works seamlessly with Astro because both use Vite under the hood
- With `<ClientRouter />`, `is:inline` scripts run only once per unique script content — after client-side navigation, swapped-in DOM has no listeners. Always wire interactivity via `astro:page-load` in a bundled module script; attach document-level listeners once with lazy DOM lookup