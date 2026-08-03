# Tech Context — Excel Formula Visualizer

## Technologies Used

### Core Framework
| Technology | Version | Purpose |
|---|---|---|
| **Astro** | v7.1.6 | Static site generation with `.astro` component syntax |
| **React** | v19.2.8 | Client-side interactive components (FormulaOutline, EvaluatorBar, ExplanationPanel) |
| **TypeScript** | v6.0.3 | Full type safety across the project (strict mode) |
| **Tailwind CSS** | v4.3.3 | Utility-first CSS framework, CSS-based configuration |
| **Node.js** | >=22.12.0 | Runtime environment |

### Integrations & Plugins
| Package | Version | Purpose |
|---|---|---|
| `@astrojs/react` | v6.0.2 | Astro integration for React component support |
| `@astrojs/netlify` | v8.1.3 | Netlify adapter for on-demand rendering of `/visualize` |
| `@tailwindcss/vite` | v4.3.3 | Vite plugin for Tailwind CSS v4 |
| `@astrojs/check` | v0.9.10 | Type checking for Astro components |

### Testing
| Package | Version | Purpose |
|---|---|---|
| **Vitest** | v4.1.10 | Unit testing framework (134 tests) |

### Fonts
| Font | Usage | Source |
|---|---|---|
| **Bricolage Grotesque** | Body text, headings | Google Fonts |
| **Spline Sans Mono** | Code/formula display | Google Fonts |

---

## Development Setup

### Prerequisites
- Node.js >= 22.12.0
- npm (comes with Node.js)

### Getting Started
```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:4321
npm run test         # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Dev Server (Background Mode)
```bash
astro dev --background   # Start in background
astro dev status         # Check if running
astro dev logs           # View logs
astro dev stop           # Stop server
```

### Build & Preview
```bash
npm run build           # Build to ./dist/
npm run preview         # Preview production build
```

---

## Configuration Files

### `astro.config.mjs`
- Astro configuration with React integration and Netlify adapter
- Netlify adapter enables on-demand rendering for server routes
- Tailwind CSS configured via `@tailwindcss/vite` Vite plugin

### `tsconfig.json`
- TypeScript strict mode enabled
- Astro's recommended base config

### `vitest.config.mts`
- Vitest configuration (zero-config with Astro/Vite)
- Minimal setup required

### `package.json`
- `type: "module"` — ES modules throughout
- `engines.node: ">=22.12.0"` — Node version requirement
- `allowScripts` — Permits postinstall scripts for esbuild and sharp

---

## Key Dependencies Details

### esbuild & sharp
Both require postinstall scripts (`allowScripts` in package.json):
- **esbuild** (v0.28.1) — Used by Vite for bundling
- **sharp** (v0.34.5) — Image optimization for Astro

### React Type Definitions
- `@types/react` v19.2.18
- `@types/react-dom` v19.2.4

---

## Deployment

### Platform: Netlify
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Adapter:** `@astrojs/netlify` v8.1.3
- **Rendering:** Static by default, on-demand for `/visualize` route
- **CI/CD:** Automatic deployment from GitHub repository

### Netlify Configuration
- `netlify.toml` for build settings, redirects, and environment variables (optional)
- Node.js version set via `.nvmrc` or `NODE_VERSION` environment variable

---

## Technical Constraints

### Framework Constraints
- **Astro Islands Architecture**: React components are islands of interactivity within static Astro pages
- **Serializable Props**: Props passed from Astro to React components must be JSON-serializable (no functions, no complex objects, no circular references)
- **Hydration Directives**: React components must use `client:*` directives (`client:load`, `client:idle`, `client:visible`, `client:media`)
- **No Client-Side Routing for Visualize**: The visualize page uses server rendering (on-demand) to parse formulas server-side; client-side navigation still works via `<ClientRouter />`

### Performance Constraints
- Deeply nested formulas can produce large ASTs — React components must handle potentially hundreds of nodes
- Use `useMemo` and `useCallback` for expensive computations (evaluation order calculation, reference map building)
- Avoid unnecessary re-renders when hover/click state changes (only affected nodes should update)

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- No IE11 support (uses modern CSS features, ES modules)
- Dark mode via `prefers-color-scheme` media query

### Accessibility Requirements
- WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation for all interactive elements
- Screen reader support for UI state changes
- Skip-to-content link on every page
- Semantic HTML throughout

---

## Project File Structure

```
/
├── .gitignore
├── AGENTS.md
├── README.md
├── astro.config.mjs
├── package.json
├── package-lock.json
├── tsconfig.json
├── vitest.config.mts
├── .clinerules/              # Project rules and conventions
│   ├── coding-conventions.md
│   ├── development.md
│   ├── memory-bank.md
│   ├── project-context.md
│   └── workflows/
├── memory-bank/              # Cline's memory bank (this directory)
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── activeContext.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   └── progress.md
├── public/                   # Unprocessed static assets
│   ├── favicon.ico
│   └── favicon.svg
└── src/
    ├── components/           # Reusable Astro + React components
    │   ├── astro/            # Astro components (marketing pages)
    │   │   ├── CopyUrlButton.astro
    │   │   ├── FeatureCard.astro
    │   │   ├── Footer.astro
    │   │   ├── FormulaEditor.astro
    │   │   ├── Hero.astro
    │   │   └── Navbar.astro
    │   └── react/            # React components (visualizer)
    │       ├── VisualizerClient.tsx
    │       ├── FormulaOutline.tsx
    │       ├── EvaluatorBar.tsx
    │       ├── ExplanationPanel.tsx
    │       └── hooks/
    │           └── useEvaluation.ts
    ├── layouts/              # Page layout components
    │   └── Layout.astro
    ├── lib/                  # Core logic (parser, translator, utilities)
    │   ├── ast/              # AST class hierarchy + traversal
    │   │   ├── ASTNode.ts
    │   │   ├── FunctionNode.ts
    │   │   ├── OperatorNode.ts
    │   │   ├── ReferenceNode.ts
    │   │   ├── LiteralNode.ts
    │   │   ├── ParentheticalNode.ts
    │   │   ├── ASTTraverser.ts
    │   │   ├── ASTTraverser.test.ts
    │   │   └── index.ts
    │   ├── parser/           # Parser (Tokenizer, Parser, FormulaError)
    │   │   ├── Tokenizer.ts
    │   │   ├── Parser.ts
    │   │   ├── FormulaError.ts
    │   │   └── index.ts
    │   ├── translate/        # Translator strategy modules
    │   │   ├── index.ts
    │   │   ├── TranslationContext.ts
    │   │   ├── logical.ts
    │   │   ├── math.ts
    │   │   ├── lookup.ts
    │   │   ├── text.ts
    │   │   ├── date.ts
    │   │   ├── statistical.ts
    │   │   ├── information.ts
    │   │   ├── financial.ts
    │   │   ├── engineering.ts
    │   │   ├── database.ts
    │   │   └── array.ts
    │   ├── functionArgs/     # Official Excel argument names
    │   │   ├── index.ts
    │   │   └── functionArgs.ts
    │   ├── parser.ts         # Backward-compat re-exports
    │   ├── parser.test.ts
    │   ├── translate.ts      # Backward-compat re-exports
    │   ├── translate.test.ts
    │   └── functionArgs.ts   # Backward-compat re-exports
    ├── pages/                # File-based routing
    │   ├── 404.astro
    │   ├── about.astro
    │   ├── how-it-works.astro
    │   ├── index.astro
    │   └── visualize.astro
    └── styles/               # Global CSS
        └── global.css
