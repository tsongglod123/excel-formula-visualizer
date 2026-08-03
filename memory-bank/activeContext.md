# Active Context — Excel Formula Visualizer

## Current Focus

The project is in an **active development** phase. All three core layers (Parse, Visualize, Explain) are implemented and functional with 121 passing tests. Current focus is on **visualization polish** and **UX enhancements**.

## Recent Changes

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
6. Begin planning component tests for React components

## Active Decisions & Considerations

- **Collapsible groups approach**: Should use React state (`useState` for expanded/collapsed tracking) with smooth CSS transitions. Consider whether to persist collapse state across re-renders.
- **Reference connection lines**: Needs careful implementation — SVG overlay or canvas-based approach. Must work with responsive layout and dark mode.
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