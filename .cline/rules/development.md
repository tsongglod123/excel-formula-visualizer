# Development

Development commands and workflow for this project.

## Dev Server

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with:

- `astro dev stop` — Stop the background server
- `astro dev status` — Check if the server is running
- `astro dev logs` — View server logs

## Commands

| Command | Action |
| :------ | :----- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally (via `netlify serve` at `localhost:8888`) |
| `npm run astro ...` | Run Astro CLI commands (`astro add`, `astro check`, etc.) |
| `npm run test` | Run Vitest tests |
| `npm run test:coverage` | Run Vitest with coverage report |

> **Note:** `astro preview` is not supported by the `@astrojs/netlify` adapter. `npm run preview` runs `netlify serve`, which serves `dist/` plus the SSR function for `/visualize`. Run `npm run build` first.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project Structure

The only directory reserved by Astro is `src/pages/`. Other directories (`src/components/`, `src/layouts/`, `src/styles/`) are conventions, not requirements.

| Directory | Purpose |
|-----------|---------|
| `src/pages/` | **Required.** File-based routing. `.astro`, `.md`, `.mdx` files become routes. |
| `src/components/astro/` | Reusable Astro components (convention) |
| `src/components/react/` | Interactive React islands (visualizer) |
| `src/layouts/` | Page layout components providing `<html>`, `<head>`, `<body>` shell with `<slot />` (convention) |
| `src/styles/` | Global CSS files (convention) |
| `public/` | Unprocessed static assets (fonts, favicon, PDFs) — copied as-is to build |

## Architecture Overview

```
Formula String → [Parse] → AST → [Visualize] → Visual Blocks → [Explain] → Plain English
```

Three individually tested layers sharing the AST as their data contract:

- **Parse** — `src/lib/parser/` (Tokenizer, Parser, FormulaError), AST hierarchy in `src/lib/ast/`
- **Visualize** — React components in `src/components/react/` (`FormulaOutline`, `EvaluatorBar`, `ExplanationPanel`, `VisualizerClient`)
- **Explain** — `src/lib/translate/` (category modules + `TranslationContext`), `functionArgs/`, `functionDocs/`

## Deployed Behavior

- The `/visualize` route is server-rendered on demand (`@astrojs/netlify` adapter, `prerender = false`) to parse formula query params
- All other pages are static