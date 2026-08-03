# Active Context — Excel Formula Visualizer

## Current Focus

The project is in an **active development** phase. All three core layers (Parse, Visualize, Explain) are implemented and functional with 121 passing tests. Current focus is on **visualization polish** and **UX enhancements**.

## Recent Changes

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