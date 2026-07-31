# Excel Formula Visualizer — Remaining Work

## Status

- ✅ **Done:** Static UI shell — Layout, Navbar, Footer, Hero, FeatureCard, Landing page, 404, How It Works, About, global.css, astro.config.mjs, tsconfig.json, package.json
- ✅ **Done:** `src/lib/parser.ts` — recursive descent AST parser (all node types, precedence, references/ranges, error handling)
- ✅ **Done:** `src/lib/translate.ts` — plain English translator (~150 Excel functions + fallback)
- ✅ **Done:** `src/lib/parser.test.ts` — 54 tests passing
- ✅ **Done:** `src/lib/translate.test.ts` — 67 tests passing
- ✅ **Done:** `src/components/VisualTree.tsx` — React interactive visual tree with color-coded blocks, collapsible groups, hover highlighting, step-by-step mode, and reference map
- ✅ **Done:** `src/components/ExplanationPanel.tsx` — React plain English panel with full translation and per-node breakdown
- ✅ **Done:** `src/pages/visualize.astro` — Visualization page with error handling, two-column layout, share/export buttons, and print-friendly styles
- ⚠️ **Fixed 8/1:** Removed stray extensionless `src/lib/parser` file (stale test copy) that shadowed `parser.ts` imports and broke Vitest

---

## Files Created (in order)

### 1. `src/lib/parser.ts` — AST Parser ✅

Define TypeScript interfaces and implement a recursive descent parser for Excel formulas.

**Node types:**

| Type | Interface | Properties |
|------|-----------|------------|
| Base | `ASTNode` | `id: string`, `type: string` |
| Function | `FunctionNode` | `name: string`, `args: ASTNode[]` |
| Operator | `OperatorNode` | `operator: string`, `left: ASTNode`, `right: ASTNode` |
| Reference | `ReferenceNode` | `reference: string`, `range?: { start: string; end: string }` |
| Literal | `LiteralNode` | `value: number \| string \| boolean`, `valueType: 'number' \| 'string' \| 'boolean'` |
| Parenthetical | `ParentheticalNode` | `expression: ASTNode` |

**Parser requirements:**
- Export `parse(formula: string): ASTNode`
- Export `FormulaError` class with `message` and `position`
- Handle: functions with comma-separated args, nested functions, arithmetic operators with precedence (`* /` before `+ -`), comparison operators (`>`, `<`, `>=`, `<=`, `=`, `<>`), cell references (`A1`, `$B$2`, `Sheet1!C5`, `A$1`), ranges (`A1:A10`, `B:B`), literals (numbers, strings, booleans), parenthesized sub-expressions, text concatenation (`&`), percent (`%`), whitespace tolerance

### 2. `src/lib/translate.ts` — Plain English Translator ✅

Implement recursive translation of AST nodes to human-readable sentences.

**Translation rules:**
- `IF(cond, true, false)` → "If [condition], then use [trueValue], otherwise use [falseValue]"
- `SUM(A1:A10)` → "The sum of cells A1 through A10"
- `A1 + B1` → "Cell A1 plus cell B1"
- `A1 > 100` → "Cell A1 is greater than 100"
- `"text"` → "the text 'text'"
- `TRUE`/`FALSE` → "true"/"false"
- Also export `translateNode` for per-node translations used by the UI

### 3. `src/components/VisualTree.tsx` — React Interactive Visual Tree ✅

Client-side React component (`'use client'`) with:
- Color-coded blocks (functions=blue, operators=amber, references=purple, literals=green, parentheses=gray)
- Nested layout with indentation/border nesting
- Collapsible/expandable groups (useState)
- Hover highlighting with parent chain and dimming
- Step-by-step mode with play/pause/forward/backward controls and animated pulsing highlight
- Reference map: click to highlight all occurrences, tooltip
- Responsive: vertical on mobile, horizontal on desktop

### 4. `src/components/ExplanationPanel.tsx` — React Plain English Panel ✅

Client-side React component (`'use client'`) with:
- Full plain-English translation display
- Per-node translations in nested list
- Highlight focused node's explanation (syncs with VisualTree hover)

### 5. `src/pages/visualize.astro` — Visualization Page ✅

- Receives `formula` from query parameter
- Server-side: parse formula, translate to English
- Pass serialized AST and translation to React components via `client:load`
- Error handling: invalid formula → error message with link home
- Two-column layout (visual tree left, explanation right)
- Share/export buttons (copy URL, export PNG)
- Print-friendly styles

### 6. `src/lib/parser.test.ts` — Parser Tests ✅

Test cases:
- `=1+1`, `=2*3+4` (basic arithmetic)
- `=1+2*3` (precedence)
- `=SUM(A1:A10)`, `=IF(A1>100,"High","Low")` (functions)
- `=SUM(IF(A1>0, A1, 0), B1:B10)` (nested)
- `=A1+$B$2`, `=Sheet1!C5` (references)
- `=A1>B1`, `=A1<>B1` (comparison)
- `=A1&"text"` (concatenation)
- `=A1%` (percent)
- Error cases: empty, no `=`, malformed, unmatched parens

### 7. `src/lib/translate.test.ts` — Translator Tests ✅

Test cases matching the translation rules above.

---

## Verification

- [x] `npm run test` — all tests pass (121 tests)
- [x] `npm run build` — builds successfully (with `@astrojs/netlify` adapter)
- [x] `npm run dev` — dev server starts without errors
- [x] Visit `/visualize?formula==SUM(A1:A10)` — visual tree + explanation renders
- [x] Visit `/visualize?formula==IF(SUM(A1:A10)>100,"Over Budget","Within Budget")` — nested tree works
- [x] Visit `/visualize` (no formula) — error message shown
- [x] Visit `/visualize?formula=hello` (no `=` prefix) — validation error shown

## Notes (8/1)

- Added `@astrojs/netlify` adapter so `/visualize` can be server-rendered (`prerender = false`) and read `?formula=` query params at request time. Other pages remain prerendered static.
- Added `html2canvas` for the Export PNG feature (dynamically imported on click to keep the initial bundle lean).
