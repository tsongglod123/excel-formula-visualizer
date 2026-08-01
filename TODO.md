# TODO — Excel Formula Visualizer

## ✅ Completed

### Parse Layer
- [x] Recursive descent parser with full operator precedence
- [x] AST node types: Function, Operator, Reference, Literal, Parenthetical
- [x] Cell references: relative (`A1`), absolute (`$A$1`), mixed (`A$1`, `$A1`)
- [x] Ranges: `A1:A10`, full columns (`B:B`), full rows (`1:1`), cross-sheet (`Sheet1!A1:Sheet2!B2`)
- [x] Sheet-qualified references (`Sheet1!C5`, `'My Sheet'!A1`)
- [x] Operators: arithmetic (`+`, `-`, `*`, `/`, `^`, `%`), comparison (`=`, `<>`, `>`, `<`, `>=`, `<=`), concatenation (`&`), unary minus
- [x] Literals: numbers (including scientific notation, decimals), strings (with `""` escaping), booleans
- [x] Error handling with position tracking (`FormulaError`)
- [x] 54 parser unit tests

### Explain Layer
- [x] Plain English translation for 100+ Excel functions
- [x] Logical functions: `IF`, `IFERROR`, `IFNA`, `IFS`, `AND`, `OR`, `NOT`, `XOR`, `SWITCH`
- [x] Math functions: `SUM`, `AVERAGE`, `COUNT`, `MAX`, `MIN`, `ROUND`, `ABS`, `SQRT`, `POWER`, `MOD`, etc.
- [x] Lookup functions: `VLOOKUP`, `HLOOKUP`, `XLOOKUP`, `INDEX`, `MATCH`, `CHOOSE`, `OFFSET`, `INDIRECT`
- [x] Text functions: `CONCATENATE`, `LEFT`, `RIGHT`, `MID`, `LEN`, `UPPER`, `LOWER`, `TRIM`, `SUBSTITUTE`, etc.
- [x] Date functions: `TODAY`, `NOW`, `YEAR`, `MONTH`, `DAY`, `DATE`, `TIME`, `WEEKDAY`, etc.
- [x] Statistical functions: `STDEV`, `VAR`, `MEDIAN`, `MODE`, `RANK`, `LARGE`, `SMALL`, `CORREL`, etc.
- [x] Financial functions: `PMT`, `FV`, `PV`, `RATE`, `NPV`, `IRR`, `SLN`, `DDB`, etc.
- [x] Engineering, database, and array functions
- [x] Generic fallback for unknown functions
- [x] Hierarchical node-by-node translation (`translateNode`)
- [x] 67 translator unit tests

### Visualize Layer
- [x] `FormulaOutline` component — color-coded nested outline view
- [x] `EvaluatorBar` component — step-by-step evaluation with play/pause/step/reset
- [x] `ExplanationPanel` component — full translation + hoverable breakdown tree
- [x] `VisualizerClient` — orchestrates all interactive components
- [x] Color coding: Functions (blue), Operators (amber), References (violet), Literals (green), Parentheses (gray)
- [x] Hover highlighting — highlights parent chain and children, dims unrelated nodes
- [x] Reference map — click a cell reference to highlight all occurrences
- [x] Step-by-step evaluation — numbers nodes in evaluation order (innermost to outermost)
- [x] Official Microsoft argument names displayed for each function argument (`functionArgs.ts`)

### Pages & UI
- [x] Landing page (`/`) — hero with formula input, feature cards, example, stats
- [x] Visualize page (`/visualize`) — server-rendered, parses formula from query param
- [x] How It Works page (`/how-it-works`)
- [x] About page (`/about`)
- [x] 404 page
- [x] Responsive navbar with mobile menu
- [x] Footer with links
- [x] Dark mode with theme toggle and system preference detection
- [x] Copy URL / share button
- [x] Skip-to-content link for accessibility
- [x] View transitions via `<ClientRouter />`

### Infrastructure
- [x] Astro 7 + React 19 + Tailwind CSS 4
- [x] Netlify adapter with on-demand rendering for `/visualize`
- [x] TypeScript strict mode
- [x] Vitest test setup (121 tests passing)
- [x] Fonts: Bricolage Grotesque (body), Spline Sans Mono (code)

---

## 🚧 In Progress

- [ ] Collapsible groups in `FormulaOutline` (collapse/expand functions and parentheticals)

---

## 📋 Planned

### Visualization Enhancements
- [ ] Visual connection lines between related cell references
- [ ] Tooltip with reference details (range info, value if available)
- [ ] Collapsible/expandable groups for large formulas
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
- [ ] Formula history / recent formulas
- [ ] Keyboard shortcuts for step-by-step mode (arrow keys, space for play/pause)
- [ ] Export visualization as image
- [ ] Embed/share via iframe
- [ ] Example formula gallery
- [ ] Deep linking to specific evaluation steps

### Testing & Quality
- [ ] Component tests for React components (`FormulaOutline`, `EvaluatorBar`, `ExplanationPanel`)
- [ ] End-to-end tests with Playwright
- [ ] Accessibility audit with axe-core
- [ ] Performance testing for very large formulas
- [ ] Visual regression testing

### Documentation
- [ ] Contributing guide (`CONTRIBUTING.md`)
- [ ] Architecture decision records
- [ ] API documentation for parser and translator
- [ ] Deployment guide