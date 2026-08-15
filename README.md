# Excel Formula Visualizer

[![Netlify Status](https://api.netlify.com/api/v1/badges/13afaf17-9680-4f97-aae5-85c94c9b71f4/deploy-status)](https://app.netlify.com/projects/excel-formula-visualizer/deploys)

Paste any Excel formula and instantly see a clear, interactive breakdown of its components, dependencies, and evaluation order — with plain-English explanations for every part.

## ✨ Features

**Parse** — Recursive descent parser converts any formula into a typed AST with full operator precedence, cell references (relative/absolute/mixed), ranges, sheet references, and 100+ functions.

**Visualize** — Interactive color-coded blocks (Functions blue, Operators amber, References violet, Literals green). Hover to trace parent/child relationships, click references to highlight all occurrences, step through evaluation order.

**Explain** — Every node translated into plain English with official Microsoft argument names (e.g., `VLOOKUP(lookup_value, table_array, col_index_num)`).

## 🚀 Quick Start

```bash
npm install
npm run dev        # → localhost:4321
npm run test       # 191 passing tests
```

## 🧞 Commands

| Command | Action |
| :------ | :----- |
| `npm run dev` | Start dev server |
| `npm run build` | Build to `./dist/` |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest tests |
| `npm run test:coverage` | Tests with coverage |

## 🏗️ Architecture

```
Formula String → [Parse] → AST → [Visualize] → Visual Blocks → [Explain] → Plain English
```

Three independent layers, tested independently. The AST is the shared data contract.

## 📚 Documentation Map

| What | Where | For |
|---|---|---|
| **Project rules & conventions** | `.clinerules/` | Agent operating instructions |
| **Architecture, tech stack, progress** | `memory-bank/` | In-depth project knowledge |
| **Contributing guide** | [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Code style, testing, commit conventions for contributors |
| **Agent skills & MCP map** | `AGENTS.md` | When to trigger each skill/MCP tool |
| **Public overview & quick start** | This README | GitHub visitors & contributors |

## 📁 Project Structure

```text
/
├── .clinerules/             # Operating rules (coding conventions, development)
├── memory-bank/             # In-depth project knowledge (architecture, progress, tech)
├── public/                  # Static assets
├── src/
│   ├── components/          # Astro + React components
│   ├── layouts/             # Page layouts
│   ├── lib/                 # Parser, translator, utilities (191 tests)
│   ├── pages/               # File-based routes
│   └── styles/              # Global CSS (Tailwind CSS v4)
└── astro.config.mjs
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro 7 |
| UI | React 19 + Tailwind CSS 4 |
| Language | TypeScript (strict) |
| Testing | Vitest 4 |
| Deployment | Netlify |
| Fonts | Bricolage Grotesque, Spline Sans Mono |

## 🌐 Deployment

Deployed on Netlify with continuous deployment from GitHub. The `/visualize` route is server-rendered to parse formula query params; all other pages are static.

## 🤝 Contributing

Contributions are welcome! See the [Contributing Guide](./CONTRIBUTING.md) for code style, testing expectations, and commit conventions.

## 📄 License

MIT