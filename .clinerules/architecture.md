# Architecture

## Three-Layer Architecture

The application follows a three-layer architecture to transform raw Excel formulas into understandable visual explanations:

```
Formula String → [Parse Layer] → AST → [Visualize Layer] → Visual Blocks → [Explain Layer] → Plain English
```

---

## 1. Parse Layer — AST Parsing

Converts a flat Excel formula string into a hierarchical tree of nodes.

### Input
- A string starting with `=` (e.g., `=IF(SUM(A1:A10)>100, "Over Budget", "Within Budget")`)

### Node Types
- **FunctionNode** — Named functions like `IF`, `SUM`, `VLOOKUP`, `CONCATENATE`
- **OperatorNode** — Arithmetic (`+`, `-`, `*`, `/`), comparison (`>`, `<`, `=`, `>=`, `<=`, `<>`), reference (`:`, `,`)
- **ReferenceNode** — Cell references (`A1`, `$B$2`, `Sheet1!C5`), ranges (`A1:A10`, `B:B`)
- **LiteralNode** — Numbers (`100`, `3.14`), strings (`"Over Budget"`), booleans (`TRUE`, `FALSE`)
- **ParentheticalNode** — Expressions within parentheses

### Implementation Approach
- Recursive descent parser or a parser combinator library
- The parser produces a typed AST that preserves nesting and evaluation precedence

---

## 2. Visualize Layer — Visual Tree Rendering

Renders the AST as nested, interactive, color-coded visual blocks.

### Color Mapping
| Node Type | Purpose |
|---|---|
| Functions | Blue — distinct hue per function name |
| Operators | Amber/Orange — comparison/arithmetic operators |
| Cell References | Purple — distinct hue per reference range |
| Literals | Green — strings, numbers, booleans |
| Parentheses | Gray — subtle grouping indicator |

### Visual Layout
- Nested blocks with indentation/border nesting to show hierarchy
- Each block displays the node's value with its color-coded background
- Collapsible/expandable groups for large formulas
- Responsive: blocks stack vertically on mobile, horizontal on desktop

### Interactive Features
- **Hover Highlighting**: Hovering a node highlights its parent chain and children in the tree
- **Step-by-Step Mode**: Numbers each node in evaluation order, animates through them one by one
- **Reference Map**: Clicking a cell reference highlights it across the entire visualization

---

## 3. Explain Layer — Plain English Translation

Converts each AST node into a human-readable sentence.

### Translation Rules
- **FunctionNode**: `IF(condition, trueValue, falseValue)` → "If [condition], then use [trueValue], otherwise use [falseValue]"
- **OperatorNode**: `A1 > 100` → "cell A1 is greater than 100"
- **ReferenceNode**: `SUM(A1:A10)` → "the sum of cells A1 through A10"
- **LiteralNode**: `"Over Budget"` → "the text 'Over Budget'"

### Recursive Translation
- Child nodes are translated first, then embedded into parent translations
- Produces a complete plain-English sentence for the entire formula

---

## Page Structure

- **`/` (index.astro)** — Landing page with Hero, FeatureCards, example visualization, and stats
- **`/visualize` (visualize.astro)** — Formula input → visualization output page (not yet created)
- **Additional pages** — `/how-it-works`, `/about` (as needed)