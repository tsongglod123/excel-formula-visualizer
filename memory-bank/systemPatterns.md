# System Patterns — Excel Formula Visualizer

## Architecture Overview

The application follows a **three-layer pipeline architecture** that transforms raw Excel formulas into understandable visual explanations:

```
Formula String → [Parse Layer] → AST → [Visualize Layer] → Visual Blocks → [Explain Layer] → Plain English
```

Each layer is independent and can be tested, modified, or replaced without affecting the others. The AST is the shared data contract between layers.

---

## 1. Parse Layer Pattern — Recursive Descent Parser

**Location:** `src/lib/parser.ts`

### Pattern: Recursive Descent with Precedence Climbing

The parser uses a tokenizer + recursive descent approach with precedence climbing for binary operators.

### Tokenizer
- Converts the raw formula string into a stream of typed tokens (functions, operators, references, literals, parentheses, commas)
- Handles character-by-character scanning with lookahead
- Preserves position information for error reporting

### Parser
- Entry point: `parse(formula: string): ASTNode`
- Removes leading `=` from the formula string
- Calls `parseExpression()` which delegates to `parseComparison()` → `parseTerm()` → `parseFactor()` → `parseUnary()` → `parsePrimary()`
- Each level handles a specific precedence tier:
  - **Concatenation** (`&`) — lowest precedence
  - **Comparison** (`=`, `<>`, `>`, `<`, `>=`, `<=`)
  - **Addition/Subtraction** (`+`, `-`)
  - **Multiplication/Division** (`*`, `/`)
  - **Exponentiation** (`^`) — right-associative
  - **Unary** (`-`, `%`)
  - **Primary** — literals, references, functions, parentheticals

### AST Node Types
```
ASTNode (base, has id: string)
├── FunctionNode     { name, args: ASTNode[] }
├── OperatorNode     { operator, left, right? }
├── ReferenceNode    { reference, range? }
├── LiteralNode      { value, valueType }
└── ParentheticalNode { expression }
```

### Error Handling
- `FormulaError` class extends `Error` with `position` property
- Errors are thrown with descriptive messages and character positions
- The visualize page catches errors and displays them to the user

---

## 2. Visualize Layer Pattern — React Component Tree

**Location:** `src/components/VisualizerClient.tsx`, `FormulaOutline.tsx`, `EvaluatorBar.tsx`, `ExplanationPanel.tsx`

### Pattern: Orchestrator + Specialized Panels

`VisualizerClient` acts as the **orchestrator** — it receives the AST and distributes it to three specialized child components, managing shared state like hovered/clicked nodes and evaluation steps.

### Component Responsibilities

| Component | Responsibility |
|---|---|
| `VisualizerClient` | State management (hover, click, steps), AST distribution, URL sharing |
| `FormulaOutline` | Renders color-coded nested blocks, hover highlighting, reference map |
| `EvaluatorBar` | Step-by-step evaluation controls (play/pause/step/reset), formula display |
| `ExplanationPanel` | Full plain-English translation, interactive breakdown tree |

### State Management Pattern
- `useState` for local UI state (collapsed nodes, current step, hover state)
- State lives in `VisualizerClient` and flows down via props
- Callbacks flow up for user interactions (onHover, onClick, onStepChange)
- No external state library — React's built-in hooks are sufficient

### Hydration Pattern
```
// In visualize.astro (server-rendered):
const ast = parse(formula);
const translation = translate(ast);
---
<VisualizerClient
  ast={ast}                    // serialized as JSON
  translation={translation}
  formula={formula}
  client:load                  // hydrate immediately
/>
```

### Color Mapping (Consistent Across All Components)
| Node Type | Color Palette |
|---|---|
| Functions | Blue (#3B82F6 family, distinct per function name) |
| Operators | Amber/Orange (#F59E0B family) |
| References | Violet/Purple (#8B5CF6 family) |
| Literals | Green (#10B981 family) |
| Parentheses | Gray/Slate (#6B7280 family) |

---

## 3. Explain Layer Pattern — Recursive Translator

**Location:** `src/lib/translate.ts`

### Pattern: Bottom-Up Recursive Translation

The translator recursively traverses the AST, translating child nodes first and embedding their results into parent translations.

### Translation Flow
```
translateNode(node):
  switch node.type:
    'literal'     → formatLiteral(node)
    'reference'   → formatReference(node)
    'operator'    → translateNode(node.left) + translateOperator(node.operator) + translateNode(node.right)
    'function'    → translateFunction(node.name, node.args.map(translateNode))
    'parenthetical' → translateNode(node.expression)
```

### Function Translation Registry
- A mapping of function names to translation templates
- 100+ Excel functions supported with specific translations
- Logical: IF, IFERROR, IFNA, IFS, AND, OR, NOT, XOR, SWITCH
- Math: SUM, AVERAGE, COUNT, MAX, MIN, ROUND, ABS, SQRT, POWER, MOD, etc.
- Lookup: VLOOKUP, HLOOKUP, XLOOKUP, INDEX, MATCH, CHOOSE, OFFSET, INDIRECT
- Text: CONCATENATE, LEFT, RIGHT, MID, LEN, UPPER, LOWER, TRIM, SUBSTITUTE, etc.
- Date/Time: TODAY, NOW, YEAR, MONTH, DAY, DATE, TIME, WEEKDAY, etc.
- Statistical, Financial, Engineering, Database, Array functions
- Generic fallback: `"{functionName}({args})"` for unrecognized functions

### Official Argument Names
**Location:** `src/lib/functionArgs.ts`

Maps each Excel function to its official Microsoft argument names. Displayed alongside translations to help users understand what each argument represents (e.g., `VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])`).

---

## 4. Page Architecture (Astro File-Based Routing)

```
src/pages/
├── index.astro       → /           (Landing page — Hero, FeatureCards, example, stats)
├── visualize.astro   → /visualize  (Visualizer page — server-rendered, reads ?formula=)
├── how-it-works.astro → /how-it-works (Explains the three-layer process)
├── about.astro       → /about       (Project mission, GitHub link)
└── 404.astro         → /*           (Not found page)
```

### Data Flow on Visualize Page
1. User submits formula on landing page → redirects to `/visualize?formula=<encoded>`
2. `visualize.astro` reads `Astro.url.searchParams.get('formula')` on the server
3. Server calls `parse(formula)` to build the AST
4. Server calls `translate(ast)` to generate the plain-English explanation
5. Server renders the page with serialized AST and translation passed as props to `VisualizerClient`
6. Client hydrates React components for interactivity

---

## 5. Styling Patterns

### Tailwind CSS v4 (CSS-Based Configuration)
- **No** `tailwind.config.js` — all configuration via `@import "tailwindcss"` in `global.css`
- Custom theme tokens defined using `@theme` directive in `global.css`
- Font family registration via `@theme`: Bricolage Grotesque (body), Spline Sans Mono (code)
- Dark mode implemented via CSS custom properties and `prefers-color-scheme` media query
- Theme toggle uses `data-theme` attribute on `<html>` element

### Component Styling
- Astro components use `<style>` blocks for component-scoped styles
- React components use Tailwind utility classes inline
- Global styles and theme tokens in `src/styles/global.css`

---

## 6. Testing Patterns

**Location:** `src/lib/parser.test.ts`, `src/lib/translate.test.ts`

### Unit Tests
- **Parser**: 54 tests covering operator precedence, functions, nested functions, cell references, ranges, comparison operators, text concatenation, percent, unary minus, booleans, numbers, strings, error cases, and complex formulas
- **Translator**: 67 tests covering arithmetic, references, ranges, comparisons, functions, logical functions, lookup functions, text functions, date functions, complex formulas, parentheticals, and generic fallback
- Run with `npm run test` (watch mode) or `npm run test:coverage` (single run with coverage)

### Testing Framework
- **Vitest 4** — zero-config with Astro/Vite
- TypeScript support out of the box
- Tests are co-located with source files (`parser.test.ts` next to `parser.ts`)