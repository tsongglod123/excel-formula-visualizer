# System Patterns — Excel Formula Visualizer

## Architecture Overview

The application follows a **three-layer pipeline architecture** that transforms raw Excel formulas into understandable visual explanations:

```
Formula String → [Parse Layer] → AST → [Visualize Layer] → Visual Blocks → [Explain Layer] → Plain English
```

Each layer is independent and can be tested, modified, or replaced without affecting the others. The AST is the shared data contract between layers.

---

## 1. Parse Layer Pattern — Recursive Descent Parser

**Location:** `src/lib/parser/`

### Pattern: Recursive Descent with Precedence Climbing

The parser uses a tokenizer + recursive descent approach with precedence climbing for binary operators.

### Class Structure (OOP)

| Class | Responsibility |
|---|---|
| `Tokenizer` | Converts raw formula string into typed tokens |
| `Parser` | Recursive descent parser with precedence climbing |
| `FormulaError` | Error class with position tracking |

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

### AST Node Class Hierarchy (Polymorphism)

**Location:** `src/lib/ast/`

```
ASTNode (abstract base, has id: string)
├── FunctionNode     { name, args: ASTNode[] }
├── OperatorNode     { operator, left, right? }
├── ReferenceNode    { reference, range? }
├── LiteralNode      { value, valueType }
└── ParentheticalNode { expression }
```

Each node class encapsulates its own behavior via polymorphic methods:
- `getChildren(): ASTNode[]` — returns child nodes
- `getLabel(): string` — returns human-readable label
- `isLeaf(): boolean` — returns true if no children

### ASTTraverser (Visitor Pattern)

**Location:** `src/lib/ast/ASTTraverser.ts`

Static utility class providing tree traversal operations:
- `findNode(root, id)` — find node by id
- `getSubtreeIds(node)` — all ids in subtree
- `getParentMap(root)` — node id → parent id map
- `getAncestors(root, nodeId)` — ancestor id set
- `subtreeHasReference(node, ref)` — check for reference in subtree
- `computeEvaluationOrder(root)` — post-order traversal
- `computeEvaluationStepMap(root)` — node id → step number map

### Error Handling
- `FormulaError` class extends `Error` with `position` property
- Errors are thrown with descriptive messages and character positions
- The visualize page catches errors and displays them to the user

---

## 2. Visualize Layer Pattern — React Component Tree

**Location:** `src/components/react/`

### Pattern: Orchestrator + Specialized Panels

`VisualizerClient` acts as the **orchestrator** — it receives the AST and distributes it to three specialized child components, managing shared state like hovered/clicked nodes and evaluation steps.

### Component Responsibilities

| Component | Responsibility |
|---|---|
| `VisualizerClient` | State management (hover, click, steps), AST distribution, URL sharing |
| `FormulaOutline` | Renders color-coded nested blocks, hover highlighting, reference map |
| `EvaluatorBar` | Step-by-step evaluation controls (play/pause/step/reset), formula display |
| `ExplanationPanel` | Full plain-English translation, interactive breakdown tree |

### Custom Hook: `useEvaluation`

**Location:** `src/components/react/hooks/useEvaluation.ts`

Encapsulates all step-by-step evaluation state:
- `evalOrder` — Map of node id → step number
- `totalSteps` — total number of evaluation steps
- `currentStep` — current step number
- `isPlaying` — play/pause state
- `currentStepNodeId` — node id for current step
- `stepForward()`, `stepBackward()`, `resetSteps()`, `togglePlay()`

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

## 3. Explain Layer Pattern — Strategy Registry

**Location:** `src/lib/translate/`

### Pattern: Strategy Pattern with Function Registry

Instead of a monolithic switch statement, each function category is a module of translator strategies. The `index.ts` merges all registries and dispatches by function name.

### Module Structure

| Module | Functions |
|---|---|
| `logical.ts` | IF, IFERROR, IFNA, IFS, AND, OR, NOT, XOR, SWITCH |
| `math.ts` | SUM, AVERAGE, COUNT, MAX, MIN, ROUND, ABS, SQRT, POWER, MOD, etc. |
| `lookup.ts` | VLOOKUP, HLOOKUP, XLOOKUP, INDEX, MATCH, CHOOSE, OFFSET, INDIRECT |
| `text.ts` | CONCATENATE, LEFT, RIGHT, MID, LEN, UPPER, LOWER, TRIM, SUBSTITUTE, etc. |
| `date.ts` | TODAY, NOW, YEAR, MONTH, DAY, DATE, TIME, WEEKDAY, etc. |
| `statistical.ts` | STDEV, VAR, MEDIAN, MODE, RANK, LARGE, SMALL, CORREL, etc. |
| `information.ts` | ISERROR, ISNUMBER, ISTEXT, ISBLANK, ISLOGICAL, etc. |
| `financial.ts` | PMT, FV, PV, RATE, NPV, IRR, SLN, DDB, etc. |
| `engineering.ts` | DEC2BIN, DEC2HEX, BIN2DEC, HEX2DEC, BITAND, BITOR, BITXOR |
| `database.ts` | DSUM, DAVERAGE, DCOUNT, DMAX, DMIN |
| `array.ts` | TRANSPOSE, UNIQUE, SORT, SORTBY, FILTER, SEQUENCE, RANDARRAY |

### Translation Flow
```
translateNode(node):
  switch node.type:
    'literal'     → formatLiteral(node)
    'reference'   → formatReference(node)
    'operator'    → translateNode(node.left) + translateOperator(node.operator) + translateNode(node.right)
    'function'    → FUNCTION_REGISTRY[node.name](node, ctx) ?? genericFallback(node, ctx)
    'parenthetical' → translateNode(node.expression)
```

### TranslationContext
**Location:** `src/lib/translate/TranslationContext.ts`

Shared context class providing:
- `translate(node)` — recursive translation
- `joinArgs(args)` — join translated args with commas and "and"
- `capitalize(s)` — capitalize first letter

### Official Argument Names
**Location:** `src/lib/functionArgs/`

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

### Client-Side Scripts with ClientRouter (View Transitions)

`Layout.astro` uses `<ClientRouter />`, so navigation is client-side DOM swapping. Rules for component `<script>` blocks:

- **Never use `<script is:inline>` for event-listener wiring.** The router deduplicates inline scripts by `textContent` (`scriptsAlreadyRan` in `transitions/swap-functions.js`): all scripts are registered at initial load, and identical inline scripts on swapped-in pages are marked `data-astro-exec` and skipped by `runScripts()` — the fresh DOM ends up with no listeners (this broke the mobile hamburger menu after any navigation).
- **Pattern:** use a bundled module `<script>` that wires listeners inside `document.addEventListener('astro:page-load', ...)`. The event fires on the initial load (module scripts register before window `load`) and after every swap.
- **Document-level listeners** (e.g., Escape key): attach once at module scope and look up elements lazily at event time, so they always operate on the current DOM and are never duplicated.
- Applied in: `Navbar.astro` (mobile menu), `CopyUrlButton.astro`, `FormulaEditor.astro`.

### Serialization Boundary: Class Instances Across Astro Islands

Props passed to a hydrated framework component (`client:*`) are serialized by Astro via `Object.entries` (`runtime/server/serialize.js`). **Class instances lose their prototype** — methods and getters are stripped; only own enumerable data properties survive as a plain object.

- The OOP AST relies on `node.type` (getter), `getChildren()`, `getLabel()`, and `instanceof` checks, all of which break on the client if the AST is passed as-is (this blanked the visualizer).
- **Pattern:** revive instances at the island entry point. Each node class has a `static fromObject(obj, revive)` factory; `ASTTraverser.deserializeAST(plain)` dispatches on structural shape and recursively revives children; `VisualizerClient` wraps the incoming prop with `useMemo(() => raw instanceof ASTNode ? raw : ASTTraverser.deserializeAST(raw), [raw])`.
- `ASTNodeObject` (in `ASTNode.ts`) describes the serialized plain-object shape.
- Only the AST prop needs this; `translation`/`nodeTranslations` are already plain data.

---

## 5. Component Organization

```
src/components/
├── astro/                    # Astro components (marketing pages)
│   ├── CopyUrlButton.astro
│   ├── FeatureCard.astro
│   ├── Footer.astro
│   ├── FormulaEditor.astro
│   ├── Hero.astro
│   └── Navbar.astro
└── react/                    # React components (visualizer)
    ├── VisualizerClient.tsx
    ├── FormulaOutline.tsx
    ├── EvaluatorBar.tsx
    ├── ExplanationPanel.tsx
    └── hooks/
        └── useEvaluation.ts
```

---

## 6. Styling Patterns

### Tailwind CSS v4 (CSS-Based Configuration)
- **No** `tailwind.config.js` — all configuration via `@import "tailwindcss"` in `global.css`
- Custom theme tokens defined using `@theme` directive in `global.css`
- Font family registration via `@theme`: Bricolage Grotesque (body), Spline Sans Mono (code)
- **Light-only theme** — dark mode is intentionally not supported. No `dark:` variants, no theme toggle, no `prefers-color-scheme` logic. The site locks light rendering via `color-scheme: light` in `global.css` and a `<meta name="color-scheme" content="light">` tag in `Layout.astro` (prevents browser force-darkening)

### Component Styling
- Astro components use `<style>` blocks for component-scoped styles
- React components use Tailwind utility classes inline
- Global styles and theme tokens in `src/styles/global.css`

---

## 7. Testing Patterns

**Location:** `src/lib/parser.test.ts`, `src/lib/translate.test.ts`, `src/lib/ast/ASTTraverser.test.ts`

### Unit Tests
- **Parser**: 54 tests covering operator precedence, functions, nested functions, cell references, ranges, comparison operators, text concatenation, percent, unary minus, booleans, numbers, strings, error cases, and complex formulas
- **Translator**: 67 tests covering arithmetic, references, ranges, comparisons, functions, logical functions, lookup functions, text functions, date functions, complex formulas, parentheticals, and generic fallback
- **ASTTraverser**: 13 tests covering findNode, getSubtreeIds, getParentMap, getAncestors, subtreeHasReference, computeEvaluationOrder, computeEvaluationStepMap
- Run with `npm run test` (watch mode) or `npm run test:coverage` (single run with coverage)

### Testing Framework
- **Vitest 4** — zero-config with Astro/Vite
- TypeScript support out of the box
- Tests are co-located with source files (`parser.test.ts` next to `parser.ts`)

### Component Tests (jsdom + Testing Library)
- **Location:** `src/components/react/*.test.tsx`, `src/components/react/hooks/*.test.ts`
- Component test files start with the `// @vitest-environment jsdom` docblock pragma; everything else runs on the fast `node` default
- `src/test/setup.ts` registers `@testing-library/jest-dom/vitest` matchers and calls `cleanup()` in `afterEach` (required: `globals: false` disables RTL auto-cleanup)
- **Island-shape pattern:** component tests pass `JSON.parse(JSON.stringify(ast))` plain objects for the `ast` prop to mirror what Astro's serializer delivers in production (see Serialization Boundary pattern above); lib tests use class instances directly
- Query style: `getByRole` with accessible names (aria-labels on outline nodes, e.g. `reference: B2, step 1`); regex-anchored names for explanation buttons (`/^\u2192\s?cell B2$/`) since parent buttons' names contain child text
- Fake timers (`vi.useFakeTimers`) for `useEvaluation` auto-play; call before `renderHook`
- Run with `npm run test` (watch) or `npx vitest run` (single run)