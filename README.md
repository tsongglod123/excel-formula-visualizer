# Excel Formula Visualizer

[![Netlify Status](https://api.netlify.com/api/v1/badges/13afaf17-9680-4f97-aae5-85c94c9b71f4/deploy-status)](https://app.netlify.com/projects/excel-formula-visualizer/deploys)

A modern web application for visualizing and understanding Excel formulas. Paste any Excel formula and instantly see a clear, interactive breakdown of its components, dependencies, and evaluation order — with plain-English explanations for every part.

## 🚀 Tech Stack

- **Framework:** [Astro](https://astro.build) v7 — static site generation with on-demand rendering for the visualize page
- **UI Components:** [React](https://react.dev) v19 — interactive client-side components (visualizer, evaluator, explanation panel)
- **Styling:** [Tailwind CSS](https://tailwindcss.com) v4 — utility-first CSS via `@tailwindcss/vite`
- **Fonts:** [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) (body), [Spline Sans Mono](https://fonts.google.com/specimen/Spline+Sans+Mono) (code)
- **Testing:** [Vitest](https://vitest.dev) v4 — unit tests for parser and translator (121 tests)
- **Deployment:** [Netlify](https://netlify.com) — continuous deployment via `@astrojs/netlify` adapter
- **Language:** TypeScript (strict mode)

## ✨ Features

### Parse & Structure
- Recursive descent parser with full operator precedence
- AST node types: functions, operators, cell references, literals, and parenthetical groups
- Supports relative (`A1`), absolute (`$A$1`), and mixed (`A$1`, `$A1`) cell references
- Handles ranges (`A1:A10`), full columns (`B:B`), full rows (`1:1`), and cross-sheet references (`Sheet1!A1:Sheet2!B2`)
- All operators: arithmetic (`+`, `-`, `*`, `/`, `^`, `%`), comparison (`=`, `<>`, `>`, `<`, `>=`, `<=`), concatenation (`&`), unary minus

### Interactive Visualization
- **Color-coded blocks** — Functions (blue), Operators (amber), References (violet), Literals (green), Parentheses (gray)
- **Hover highlighting** — Hover any node to highlight its parent chain and children while dimming the rest of the tree
- **Step-by-step evaluation** — Walk through the formula in evaluation order (innermost to outermost) with play, pause, step forward/backward, and reset controls
- **Reference map** — Click any cell reference to highlight all occurrences across the visualization
- **Official argument names** — Each function argument is labeled with its official Microsoft Excel name (e.g., `lookup_value`, `table_array`)

### Plain English Translation
- Every formula node is translated into a human-readable sentence
- 100+ Excel functions supported with specific translations:
  - **Logical:** `IF`, `IFERROR`, `IFNA`, `IFS`, `AND`, `OR`, `NOT`, `XOR`, `SWITCH`
  - **Math:** `SUM`, `AVERAGE`, `COUNT`, `MAX`, `MIN`, `ROUND`, `ABS`, `SQRT`, `POWER`, `MOD`, and more
  - **Lookup:** `VLOOKUP`, `HLOOKUP`, `XLOOKUP`, `INDEX`, `MATCH`, `CHOOSE`, `OFFSET`, `INDIRECT`
  - **Text:** `CONCATENATE`, `LEFT`, `RIGHT`, `MID`, `LEN`, `UPPER`, `LOWER`, `TRIM`, `SUBSTITUTE`, and more
  - **Date & Time:** `TODAY`, `NOW`, `YEAR`, `MONTH`, `DAY`, `DATE`, `TIME`, `WEEKDAY`, and more
  - **Statistical, Financial, Engineering, Database, and Array** functions
- Generic fallback for any unrecognized function

### UI & Accessibility
- Dark mode with system preference detection and manual toggle
- Responsive design — works on mobile, tablet, and desktop
- Keyboard accessible with visible focus indicators and skip-to-content link
- View transitions for smooth page navigation
- Share formulas via URL with encoded query parameter

## 📁 Project Structure

```text
/
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── CopyUrlButton.astro      # Copy current URL button
│   │   ├── EvaluatorBar.tsx         # Step-by-step evaluation controls + formula display
│   │   ├── ExplanationPanel.tsx     # Plain English translation + breakdown tree
│   │   ├── FeatureCard.astro        # Feature card for landing page
│   │   ├── Footer.astro             # Site footer
│   │   ├── FormulaEditor.astro      # Formula input form with validation
│   │   ├── FormulaOutline.tsx       # Color-coded nested outline of the AST
│   │   ├── Hero.astro               # Hero section with formula input
│   │   ├── Navbar.astro             # Responsive navbar with mobile menu
│   │   ├── ThemeToggle.astro        # Dark/light mode toggle
│   │   └── VisualizerClient.tsx     # Orchestrates all interactive visualizer components
│   ├── layouts/
│   │   └── Layout.astro             # Page shell with <html>, <head>, <body>
│   ├── lib/
│   │   ├── functionArgs.ts          # Official Microsoft Excel argument names
│   │   ├── parser.ts                # Recursive descent formula parser → AST
│   │   ├── parser.test.ts           # Parser unit tests (54 tests)
│   │   ├── translate.ts             # AST → plain English translation
│   │   └── translate.test.ts        # Translator unit tests (67 tests)
│   ├── pages/
│   │   ├── 404.astro                # Not found page
│   │   ├── about.astro              # About page
│   │   ├── how-it-works.astro       # How It Works page
│   │   ├── index.astro              # Landing page
│   │   └── visualize.astro          # Formula visualization page (server-rendered)
│   └── styles/
│       └── global.css               # Tailwind CSS v4 theme + global styles
├── astro.config.mjs                 # Astro config with React + Netlify adapter
├── package.json
├── tsconfig.json
├── vitest.config.mts
└── README.md
```

## 🧞 Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run test`            | Run unit tests in watch mode                     |
| `npm run test:coverage`   | Run unit tests with coverage report              |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

## 🧪 Testing

The project uses Vitest for unit testing the core logic:

```bash
npm run test          # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

Tests cover:
- **Parser** (54 tests) — operator precedence, functions, nested functions, cell references, ranges, comparison operators, text concatenation, percent, unary minus, booleans, numbers, strings, error cases, and complex formulas
- **Translator** (67 tests) — arithmetic, references, ranges, comparisons, functions, logical functions, lookup functions, text functions, date functions, complex formulas, parentheticals, and the generic fallback

## 🏗️ Architecture

The application follows a three-layer architecture:

```
Formula String → [Parse Layer] → AST → [Visualize Layer] → Visual Blocks → [Explain Layer] → Plain English
```

1. **Parse** — A recursive descent parser converts the flat formula string into a typed Abstract Syntax Tree (AST) with proper operator precedence
2. **Visualize** — React components render the AST as nested, color-coded, interactive visual blocks with hover highlighting and step-by-step evaluation
3. **Explain** — A recursive translator converts each AST node into a human-readable sentence, producing a complete plain-English explanation

## 🌐 Deployment

The site is deployed on Netlify with continuous deployment from GitHub:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- The `/visualize` route is server-rendered (on-demand) to read formula query parameters; all other pages are prerendered as static HTML

## 📄 License

MIT