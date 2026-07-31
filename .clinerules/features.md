# Features

## Formula Input

- Accept an Excel formula string starting with `=` via a text input field
- Located on the Hero component of the landing page
- POSTs to `/visualize?formula=<encoded-formula>` on submission
- Client-side validation: ensure string starts with `=`, provide helpful error message if not

## AST Parsing

Parse the formula string into an Abstract Syntax Tree with the following node types:

- **FunctionNode** — `IF`, `SUM`, `AVERAGE`, `VLOOKUP`, `CONCATENATE`, `ROUND`, etc.
  - Property: `name` (the function name), `args` (array of child nodes)
- **OperatorNode** — Arithmetic (`+`, `-`, `*`, `/`), comparison (`>`, `<`, `=`, `>=`, `<=`, `<>`)
  - Property: `operator` (string), `left`, `right` (child nodes)
- **ReferenceNode** — Cell references (`A1`, `$B$2`, `Sheet1!C5`), ranges (`A1:A10`, `B:B`)
  - Property: `reference` (string), `range` (optional start/end for ranges)
- **LiteralNode** — Numbers, strings (`"text"`), booleans (`TRUE`, `FALSE`)
  - Property: `value` (parsed value), `type` ("number" | "string" | "boolean")
- **ParentheticalNode** — Parenthesized sub-expressions
  - Property: `expression` (child node)

## Visual Tree Rendering

Render the AST as interactive, color-coded visual blocks:

- **Color Coding**:
  - Functions: Blue (distinct hue per function name for recognition)
  - Operators: Amber/Orange
  - Cell References: Purple
  - Literals: Green
  - Parentheses: Gray
- **Nested Layout**: Indentation and border nesting shows tree hierarchy
- **Collapsible Groups**: Functions and parenthesized expressions can be collapsed/expanded
- **Responsive**: Vertical stacking on mobile, horizontal layout on desktop

## Plain English Translation

Convert each node to a human-readable sentence:

- `IF(A1>100, "High", "Low")` → "If cell A1 is greater than 100, then use the text 'High', otherwise use the text 'Low'"
- `SUM(A1:A10)` → "The sum of cells A1 through A10"
- `A1 + B1` → "Cell A1 plus cell B1"
- `AVERAGE(B2:B10) > 50` → "The average of cells B2 through B10 is greater than 50"

## Interactive Features

### Hover Highlighting
- Hovering a node highlights its parent chain and direct children
- Use CSS transitions for smooth highlight effects
- Dimmed opacity for non-related nodes

### Step-by-Step Mode
- Number each node in evaluation order (innermost to outermost)
- Play/pause and step forward/backward controls
- Animated transitions between steps
- Highlight the currently evaluating node with a pulsing effect

### Reference Map
- Clicking a cell reference highlights all occurrences of that reference
- Show tooltip with reference details (range, value if available)
- Visual connection lines between related references

## Export & Share

- Export visualization as PNG image
- Share via URL with encoded formula in query parameter
- Print-friendly styles for the visualization page