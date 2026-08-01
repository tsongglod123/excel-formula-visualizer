# Tech Stack

## Framework
- **Astro 7** — Static site generation with `.astro` component syntax
- **TypeScript** — Full type safety across the project, configured via `tsconfig.json` using `strict` template
- **React 19** — For interactive client-side components (step-by-step mode, hover highlighting, reference map, collapsible groups)
- **@astrojs/react** — Astro integration for React, hydrates components via `client:*` directives

## Styling
- **Tailwind CSS 4** — Utility-first CSS framework via `@tailwindcss/vite` Vite plugin
- No `tailwind.config.js` needed (Tailwind v4 uses CSS-based configuration with `@import "tailwindcss"` in `global.css`)
- CSS custom properties for theme consistency, defined using `@theme` directive in `global.css`
- Import `global.css` in layout components to make Tailwind styles available site-wide

## Fonts
- **Bricolage Grotesque** — Body text (distinctive, characterful sans-serif), registered in Tailwind via `@theme` directive in `global.css`
- **Spline Sans Mono** — Code/formula display (readable monospace), loaded via Google Fonts in `Layout.astro`

## Deployment
- **Netlify** — Continuous deployment from GitHub
- **Build command:** `npm run build` (outputs to `dist/`)
- **Publish directory:** `dist`
- Static site deployment (no adapter needed for static sites; `@astrojs/netlify` adapter required for on-demand rendering)
- Optional `netlify.toml` file for configuring build settings, redirects, and environment variables
- Node.js version set via `.nvmrc` file or `NODE_VERSION` environment variable in Netlify dashboard

## Testing
- **Vitest 4** — Unit testing for TypeScript logic (AST parser, plain English translation)
- Zero config with Astro (Vite-based)
- Run tests: `npm run test`
- Coverage report: `npm run test:coverage`

## Node Requirements
- **Node.js >= 22.12.0**

## Available MCP Skills & Tools
When working on this project, leverage the following available capabilities:

| Skill / Tool | When to Use |
|---|---|
| `frontend-design` | Creating new components, pages, or layouts — follow for bold, distinctive design choices |
| `web-design-guidelines` | Reviewing UI for accessibility, usability, and design compliance |
| `vercel-react-best-practices` | Writing, reviewing, or refactoring React components — 40+ rules for performance optimization |
| `astro-docs` | Looking up Astro-specific APIs, patterns, or configuration |
| `microsoft-learn` | Searching official Microsoft documentation for Excel formula behavior |
| `sequential-thinking` | Breaking down complex problems (parsing, visualization logic) |