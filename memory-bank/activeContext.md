# Active Context — Excel Formula Visualizer

## Current Focus

The project is in an **active development** phase. All three core layers (Parse, Visualize, Explain) are implemented and functional with 226 passing tests. Current focus is on **visualization polish** and **UX enhancements** — collapsible groups, connection lines, reference tooltips, formula history, structural nesting, compact-by-default pills, and Expand/Collapse-all just shipped. Next up: evaluator keyboard shortcuts, then Playwright E2E.

## Recent Changes

### Completed: Compact, Office-Friendly Tree (compactness revisit)

- **Problem** — after the structural-nesting fix, every function call became a row, so even `=IF(SUM(A1:A10)>100,"Yes","No")` exploded into 6 rows. Too tall for quick office scanning.
- **Rule change** — `isCompactSubtree` now pills a subtree when it contains **no function call nested inside another function call** (`containsFunctionCall` helper). Simple calls (`SUM(A1:A10)`) and flat fragments (`B2>100`) stay compact pills; genuinely nested calls (`LET(…, IF(AND(…), …))`) break out into rows at each nesting boundary. The flagship formula now renders 4 rows instead of 6; `CompactSubtree`'s function branch is live again.
- **Bulk controls** — the outline toolbar gained **Expand all / Collapse all** buttons (`collectCollapsibleIds` mirrors OutlineNode's row-vs-pill decision; buttons hide when nothing is collapsible, disable at the all-expanded/all-collapsed bounds, and dismiss open overlays).
- **Tests** — 223 → 226: reworked the 4 `structural nesting` tests to the new rule + 3 new `expand and collapse all` tests. astro check 0 errors; SSR-verified compact (4-row flagship), deep (nested IF row), and flat (no bulk buttons) renders.

### Completed: Structural Nested Rows (isAllLeafSubtree revisit)

- **Root cause** — `isAllLeafSubtree` had no `false` base case (literals/references → true; every other node recursed to leaves, which are always literals/references), so it returned `true` for *every* AST: the recursive `OutlineNode` child path was dead code and nested LET/IF chains flattened into one wide pill.
- **Fix** — replaced it with `isCompactSubtree`: a subtree pills only when it's a *flat expression* (operators/literals/references, no function calls, no parentheticals). Function calls and groups now get their own rows with collapse toggles and evaluation-step badges; flat fragments like `B2>100` keep the compact-pill look. All 219 pre-existing tests passed unchanged; +4 new `structural nesting` tests (nested function rows, flat stays compact, operator-with-function becomes structural, step badges on every row). 219 → 223 tests. SSR-verified: `/visualize?formula==LET(x,5,IF(x>10,...))` serves nested `function: IF` treeitem rows with toggles; `=A1+B1*2` stays a single pill row.

### Completed: Reference Connection Lines, Reference Tooltips, Formula History

- **Connection lines** — clicking a reference pill now also draws accent-colored bezier connectors between every occurrence in the outline. An absolutely-positioned SVG (`data-testid="ref-connection-lines"`) lives inside the zoom canvas (`contentRef`), so lines scale with zoom automatically; positions are measured via transform-free `offsetLeft/offsetTop` walks (correct at any zoom). Pills carry `data-ref`; occurrences inside collapsed (`inert`) subtrees are skipped. Re-measured on selection/AST/collapse/content-resize.
- **Reference tooltips** — hovering or focusing a reference pill opens a tooltip (200ms intent delay) showing kind (Cell/Range), geometry (`10 rows × 1 column`, `Entire column`, …), sheet (+ end sheet for 3D refs), absolute/relative/mixed addressing, and an occurrence count. New pure lib: `src/lib/referenceInfo.ts` (`describeReference`, `countReferenceOccurrences`). Tooltip is fixed-position with bottom-edge flip, `role="tooltip"` + imperative `aria-describedby` on the anchor pill, closes on leave/blur/Escape/scroll/zoom/collapse. A `RefTooltipContext` (same pattern as FunctionDocContext) reaches recursive pills without prop drilling.
- **Formula history** — `src/lib/formulaHistory.ts` (localStorage, key `efv:recent-formulas`, capped at 8, deduped, all I/O guarded). `VisualizerClient` gained a `formula` prop and records each successful visualization. New `RecentFormulas` island renders clickable chips (→ `/visualize?formula=…`) on the landing hero and the visualize editor, with a Clear button; renders nothing when empty.
- **Tests** — 188 → 219 (referenceInfo 10, formulaHistory 6, RecentFormulas 4, FormulaOutline +6, VisualizerClient +2).

### Completed: Deepen ASTTraverser with getNodeIndex (codebase-design skill)

- **New deep primitive** — `ASTTraverser.getNodeIndex(root)` builds a reusable `{ byId, parentById }` index of the whole AST in a single walk, giving O(1) node + parent lookup. Applied the `codebase-design` deep-module lens: consumers needing several tree facts at once should build this index once and derive from it instead of calling `findNode`/`getAncestors`/`getSubtreeIds` separately (each re-walks the tree).
- **Locality + perf win in `FormulaOutline`** — the hover-dimming memo previously orchestrated three separate full-tree traversals (`findNode`, `getAncestors`→`getParentMap`, plus an inline `collectIds`) to compute one `Set<string>` of dimmed ids. It now builds `getNodeIndex` once, derives ancestors via the parent map, and reuses `getSubtreeIds` on the (typically small) hovered subtree — one full walk instead of many. Serves the "performance for very large formulas" goal (progress.md TODO).
- **Tests** — 3 new `getNodeIndex` tests (byId contents incl. leaf label, parentById incl. root-has-none, and the ancestor-derivation pattern the component now uses). FormulaOutline hover tests unchanged and green. 188 → 191 tests; `astro check` clean.

### Completed: Contributor Skills + CONTRIBUTING.md

- **New skills installed** — `write-coding-standards-from-file` (project-local, from `github/awesome-copilot`, tracked in `skills-lock.json`) plus three global process skills from `mattpocock/skills`: `code-review` (two-axis standards+spec review), `diagnosing-bugs` (red-loop debug discipline), and `codebase-design` (deep-module vocabulary). These were deliberately scoped: the framework skills stay project-local, the process skills are global since they're repo-agnostic.
- **`CONTRIBUTING.md` generated** (new at repo root) using the `write-coding-standards-from-file` skill against the `src/` tree — documents conventions observed in the actual code (2-space indent, semicolons, single quotes, `interface Props` + `Astro.props` destructuring, `'use client'` React islands with serializable props, Tailwind v4 `@theme` tokens, light-only theme, Vitest/`describe`+`it` style, Conventional Commits scope style). It complements rather than replaces `.cline/rules/coding-conventions.md` (agent-facing) and the README; keep the three in sync when conventions change.

### Completed: Collapsible Groups in the Formula Outline

- **Collapse/expand toggles** in `FormulaOutline` — every row that renders a child list (functions with args, non-leaf operators, parentheticals) gets a chevron button. State lives in `FormulaOutline` as a `Set<string>` shared through a new `CollapseContext` (mirrors the existing `FunctionDocContext` pattern) so recursive `OutlineNode`s need no prop drilling, and it resets when a new AST mounts (view-transition navigation between share links).
- **Animation + accessibility** — child lists render via a `CollapsibleChildren` wrapper: CSS `grid-template-rows` 1fr→0fr transition (no measurement needed), `inert` + `aria-hidden` when collapsed so hidden rows leave the tab order and the a11y tree, `aria-expanded` on the toggle, a rotating chevron, and a “N hidden” count chip while collapsed.
- **Tests** — new `collapsible groups` describe block in `FormulaOutline.test.tsx`: toggle present + expanded by default, collapse hides child rows / marks the wrapper inert / shows the count chip, collapsing one row leaves ancestors untouched, expand restores rows, zero-child rows get no toggle, and collapse state resets on a new AST. 182 → 188 tests.

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

_None active — collapsible groups, connection lines, reference tooltips, formula history, and structural nested rows shipped. See Next Steps for the queued work._

## Next Steps (Priority Order)

1. Consider keyboard shortcuts for step-by-step mode (arrow keys, space for play/pause)
2. Add end-to-end tests with Playwright (real browser, island hydration)

## Active Decisions & Considerations

- **Collapsible groups (resolved)**: React `useState` in `FormulaOutline` (`Set<string>`), CSS grid-rows transition for height, `inert` + `aria-hidden` on hidden subtrees. State intentionally not persisted; resets on new AST.
- **Reference connection lines (resolved)**: SVG overlay inside the zoom canvas (not a separate layer) — transform-free offset measurement, lines scale with zoom for free, `[inert]`-collapsed occurrences excluded.
- **Tooltip positioning (resolved)**: Reused the function-doc popover pattern — `position: fixed` (escapes the zoomed/scrolling canvas), bottom-edge flip, viewport clamping. No floating-UI dependency needed.
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