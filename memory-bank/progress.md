# Progress — Excel Formula Visualizer

## What Works (Completed)

### Tooling & Skills ✅
- Agent skills installed: `codebase-design`, `code-review`, `diagnosing-bugs` (global) and `write-coding-standards-from-file` (project-local, in `skills-lock.json`) — plus the existing Astro/React framework skills
- `CONTRIBUTING.md` generated from `src/` conventions via the `write-coding-standards-from-file` skill
- Full skill trigger map documented in `AGENTS.md` and `memory-bank/techContext.md`

### Parse Layer ✅
- Recursive descent parser with full operator precedence
- **OOP class hierarchy**: `Tokenizer`, `Parser`, `FormulaError` in `src/lib/parser/`
- **AST class hierarchy**: `ASTNode` abstract base + 5 concrete node classes in `src/lib/ast/`
  - Polymorphic methods: `getChildren()`, `getLabel()`, `isLeaf()`
- **ASTTraverser**: Static utility class for tree traversal (findNode, getSubtreeIds, getParentMap, getNodeIndex, getAncestors, subtreeHasReference, computeEvaluationOrder, computeEvaluationStepMap)
- Cell references: relative (`A1`), absolute (`$A$1`), mixed (`A$1`, `$A1`)
- Ranges: `A1:A10`, full columns (`B:B`), full rows (`1:1`), cross-sheet (`Sheet1!A1:Sheet2!B2`)
- Sheet-qualified references (`Sheet1!C5`, `'My Sheet'!A1`)
- Operators: arithmetic (`+`, `-`, `*`, `/`, `^`, `%`), comparison (`=`, `<>`, `>`, `<`, `>=`, `<=`), concatenation (`&`), unary minus
- Literals: numbers (including scientific notation, decimals), strings (with `""` escaping), booleans
- Error handling with position tracking (`FormulaError`)
- 54 parser unit tests + 21 ASTTraverser unit tests

### Explain Layer ✅
- Plain English translation for 100+ Excel functions
- Logical functions: IF, IFERROR, IFNA, IFS, AND, OR, NOT, XOR, SWITCH
- Math functions: SUM, AVERAGE, COUNT, MAX, MIN, ROUND, ABS, SQRT, POWER, MOD, etc.
- Lookup functions: VLOOKUP, HLOOKUP, XLOOKUP, INDEX, MATCH, CHOOSE, OFFSET, INDIRECT
- Text functions: CONCATENATE, LEFT, RIGHT, MID, LEN, UPPER, LOWER, TRIM, SUBSTITUTE, etc.
- Date functions: TODAY, NOW, YEAR, MONTH, DAY, DATE, TIME, WEEKDAY, etc.
- Statistical functions: STDEV, VAR, MEDIAN, MODE, RANK, LARGE, SMALL, CORREL, etc.
- Financial functions: PMT, FV, PV, RATE, NPV, IRR, SLN, DDB, etc.
- Engineering, database, and array functions
- Generic fallback for unknown functions
- Hierarchical node-by-node translation (`translateNode`)
- 67 translator unit tests

### Visualize Layer ✅
- `FormulaOutline` component — file-explorer style tree with connector guides, compact leaf pills, zoom controls
- `EvaluatorBar` component — step-by-step evaluation with play/pause/step/reset
- `ExplanationPanel` component — full plain-English translation with copy button (step-by-step breakdown tree removed as redundant with EvaluatorBar's current-step display)
- `VisualizerClient` — orchestrates all interactive components
- Color coding: Functions (blue), Operators (amber), References (violet), Literals (green), Parentheses (gray)
- Hover highlighting — highlights parent chain and children, dims unrelated nodes
- Reference map — click a cell reference to highlight all occurrences
- Step-by-step evaluation — numbers nodes in evaluation order (innermost to outermost)
- Official Microsoft argument names displayed for each function argument (`functionArgs.ts`)
- Function-help popover — tap or hover any function name to see a short plain-English summary, syntax, returns, and a link to the official Microsoft support page (`https://support.microsoft.com/en-us/excel/functions/{func-name}-function`, `functionDocs.ts`, ~200 functions, full-coverage tested)
- Collapsible groups — a chevron toggle on every row that renders a child list; hidden subtrees leave the tab order via `inert` + `aria-hidden` and animate shut with a CSS grid-rows transition, with a “N hidden” count chip
- Expand all / Collapse all toolbar buttons — one-click bulk control for every collapsible row (auto-hidden when nothing is collapsible)
- Compact-by-default outline — simple calls and flat operator fragments render as inline pills; only function-in-function nesting breaks out into structural rows
- Reference connection lines — selecting a reference draws accent-colored bezier connectors between every occurrence pill (SVG overlay inside the zoom canvas, transform-free offset math, tracks collapse/zoom, skips inert-collapsed subtrees)
- Reference tooltips — hover/focus intent (~200ms) on any reference shows a tooltip with kind, dimensions (e.g. “10 rows × 1 column”), sheet, absolute/relative/mixed addressing, and occurrence count (`describeReference` in `src/lib/referenceInfo.ts`)

### Pages & UI ✅
- Landing page (`/`) — hero with formula input, feature cards, example, stats
- Visualize page (`/visualize`) — server-rendered, parses formula from query param
- How It Works page (`/how-it-works`)
- About page (`/about`)
- 404 page
- Responsive navbar with mobile menu
- Footer with links
- Copy URL / share button
- Recent formulas — localStorage-backed history of visualized formulas (`src/lib/formulaHistory.ts`), rendered as clickable chips on the landing hero and the visualize editor (`src/components/react/RecentFormulas.tsx`)
- Skip-to-content link for accessibility
- View transitions via `<ClientRouter />`

### Infrastructure ✅
- Astro 7 + React 19 + Tailwind CSS 4
- Netlify adapter with on-demand rendering for `/visualize`
- TypeScript strict mode
- Vitest test setup (226 tests passing) with jsdom + Testing Library for component tests
- Fonts: Bricolage Grotesque (body), Spline Sans Mono (code)

---

## In Progress

_None active — the previous in-progress item (collapsible groups) shipped in this round. See "What's Left to Build" for the backlog._

---

## What's Left to Build

### High Priority (Visualization Polish)
- [ ] Minimap for very large formula trees
- [ ] Zoom and pan for complex nested formulas

### Parser Improvements
- [ ] Array constants (`{1,2,3}`)
- [ ] Structured references (`Table1[Column1]`)
- [ ] Named ranges
- [ ] Dynamic array functions (`FILTER`, `SORT`, `UNIQUE`, `SEQUENCE`, `RANDARRAY`)
- [ ] Lambda functions (`LAMBDA`, `LET`, `MAP`, `REDUCE`, `SCAN`)
- [ ] Better error recovery with suggestions

### Translation Improvements
- [ ] More natural language variations
- [ ] Context-aware translations (e.g., detect when a reference is used as a condition)
- [ ] Translations for newer Excel functions
- [ ] Localization support (multiple languages)

### UX & Features
- [ ] Keyboard shortcuts for step-by-step mode (arrow keys, space for play/pause)
- [ ] Export visualization as image
- [ ] Embed/share via iframe
- [ ] Example formula gallery
- [ ] Deep linking to specific evaluation steps

### Testing & Quality
- [x] Component tests for React components (`VisualizerClient`, `FormulaOutline`, `EvaluatorBar`, `ExplanationPanel`, `useEvaluation`)
- [ ] End-to-end tests with Playwright
- [ ] Accessibility audit with axe-core
- [ ] Performance testing for very large formulas
- [ ] Visual regression testing

### Documentation
- [x] Contributing guide (`CONTRIBUTING.md`) — generated with the `write-coding-standards-from-file` skill from `src/` conventions
- [ ] Architecture decision records
- [ ] API documentation for parser and translator
- [ ] Deployment guide

---

## Known Issues

_No critical known issues at this time. All 226 tests are passing._

---

## Project Evolution

### Phase 1: Foundation (Complete)
- Set up Astro project with React, Tailwind CSS 4, TypeScript
- Implement recursive descent parser with operator precedence
- Implement plain-English translator for 100+ functions
- Create static pages (landing, about, how-it-works, 404)
- Set up Netlify deployment

### Phase 2: Interactivity (Complete)
- Build React components: FormulaOutline, EvaluatorBar, ExplanationPanel
- Add hover highlighting, step-by-step evaluation, reference map
- Integrate official Microsoft argument names
- Add view transitions, share button
- Server-render visualize page with on-demand rendering

### Phase 3: Polish & Enhancement (Current)
- Collapsible groups for large formulas (complete — toggles on every structural row, inert-hidden subtrees)
- Visual connection lines between references (complete)
- Tooltips and reference details (complete)
- Keyboard shortcuts
- Formula history (complete)

### Phase 4: Advanced Features (Planned)
- Array constants, structured references, named ranges
- Dynamic array and lambda functions
- Localization support
- Export, embed, and sharing enhancements
- Comprehensive testing suite

### Phase 5: Maturity (Future)
- Community contributions
- Accessibility audit and remediation
- Performance optimization for very large formulas
- Example formula gallery
- Visual regression testing

---

## Test Coverage Summary

| Layer | Tests | Coverage |
|---|---|---|
| Parser (`parser.test.ts`) | 54 | Operator precedence, functions, nested, references, ranges, comparisons, concatenation, percent, unary minus, booleans, numbers, strings, errors, complex formulas |
| Translator (`translate.test.ts`) | 67 | Arithmetic, references, ranges, comparisons, functions, logical, lookup, text, date, complex formulas, parentheticals, generic fallback |
| ASTTraverser (`ASTTraverser.test.ts`) | 21 | findNode, getSubtreeIds, getParentMap, getNodeIndex, getAncestors, subtreeHasReference, computeEvaluationOrder, computeEvaluationStepMap, deserializeAST round-trip |
| functionDocs (`functionDocs.test.ts`) | 10 | Full-coverage invariant: every `FUNCTION_ARG_NAMES` entry has a summary + docs, syntax generation incl. optional `[]` and variadic `…` |
| referenceInfo (`referenceInfo.test.ts`) | 10 | describeReference: cells, anchoring, ranges, reversed ranges, columns/rows, sheets, 3D refs + countReferenceOccurrences |
| formulaHistory (`formulaHistory.test.ts`) | 6 | load/record/dedupe/cap/clear/corrupt-storage handling |
| VisualizerClient (`VisualizerClient.test.tsx`) | 5 | Plain-object AST island regression, class-instance AST, playback controls, history recording, connection lines |
| RecentFormulas (`RecentFormulas.test.tsx`) | 4 | Empty state, chip links, clear button, corrupt storage |
| FormulaOutline (`FormulaOutline.test.tsx`) | 33 | Legend, step numbers, hover callbacks, reference selection, subtree dimming, current-step ring, Excel active-cell selection, zoom controls, collapsible groups, reference tooltips, connection lines |
| EvaluatorBar (`EvaluatorBar.test.tsx`) | 7 | Step display, playback callbacks, disabled states at bounds, formula rendering, current-node highlight |
| ExplanationPanel (`ExplanationPanel.test.tsx`) | 3 | Full translation, copy button, scrollable container |
| useEvaluation (`useEvaluation.test.ts`) | 6 | Initial state, step bounds, reset, node-id mapping, auto-advance with fake timers |
| **Total** | **226** | **All passing** |
