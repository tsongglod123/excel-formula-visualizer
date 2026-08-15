# Contributing to Excel Formula Visualizer

Thanks for your interest in contributing! This guide captures the conventions observed across the codebase so contributions land smoothly. It is the contributor-facing companion to the operating rules in `.clinerules/` and the project knowledge in `memory-bank/`.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure & Architecture](#project-structure--architecture)
3. [General Code Style](#general-code-style)
4. [TypeScript Conventions](#typescript-conventions)
5. [Astro Conventions](#astro-conventions)
6. [React Conventions](#react-conventions)
7. [Styling with Tailwind CSS v4](#styling-with-tailwind-css-v4)
8. [Testing](#testing)
9. [Accessibility & Design Compliance](#accessibility--design-compliance)
10. [Commit & Review Practices](#commit--review-practices)
11. [Changes to This Document](#changes-to-this-document)

---

## Getting Started

**Prerequisites:** Node.js >= 22.12.0 and npm.

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:4321
npm run build        # Build production site to ./dist/
npm run test         # Run Vitest (watch mode)
npm run test:coverage # Run tests with coverage report
```

Notes on the local environment:

- The dev server uses Astro's background mode. Prefer `astro dev --background` and manage it with `astro dev status` / `astro dev stop` / `astro dev logs`.
- `astro preview` is **not** supported (the `@astrojs/netlify` adapter has no preview entrypoint). Use `npm run preview`, which runs `netlify serve` on http://localhost:8888 after a production build.

## Project Structure & Architecture

The codebase is organized as three independently tested layers:

```text
Formula String → [Parse] → AST → [Visualize] → Visual Blocks → [Explain] → Plain English
```

- `src/lib/parser/` — recursive-descent `Tokenizer` + `Parser` + `FormulaError`, producing a typed AST
- `src/lib/ast/` — AST class hierarchy (`ASTNode` base + concrete nodes) and `ASTTraverser` static utilities
- `src/lib/translate/` — plain-English translation, split into category modules (`logical`, `math`, `lookup`, `text`, `date`, `statistical`, `information`, `financial`, `engineering`, `database`, `array`) plus a shared `TranslationContext`
- `src/lib/functionArgs/` and `src/lib/functionDocs/` — official Excel argument names and function help data
- `src/components/astro/` — static Astro components (marketing pages)
- `src/components/react/` — interactive React islands (`FormulaOutline`, `EvaluatorBar`, `ExplanationPanel`, `VisualizerClient`) and `hooks/`
- `src/pages/` — file-based routing; `/visualize` is server-rendered, everything else static
- `src/layouts/`, `src/styles/` — shared layout shell and `global.css`

**The AST is the shared data contract.** Changes that alter AST shape must keep `deserializeAST` round-tripping and update `ASTTraverser` tests accordingly. Backward-compat re-exports live at `src/lib/parser.ts`, `src/lib/translate.ts`, and `src/lib/functionArgs.ts` — keep them in sync.

## General Code Style

Rules inferred from the existing code — follow them unless a PR explicitly and justifiably changes one:

- **Formatting:** 2-space indentation, semicolons at end of statements, single quotes for strings, files end with a newline.
- **Line length:** keep lines comfortably readable (the codebase stays well under 120 characters; ~100 is a good target).
- **Clarity over brevity.** Prefer small, focused functions and descriptive names over clever one-liners.
- **No dead code:** remove unused variables, imports, types, and files. TypeScript strict mode will fail the check otherwise.
- **Type-only imports** use the `type` modifier: `import type { ASTNode } from '../../lib/ast'`.

## TypeScript Conventions

The project runs TypeScript in strict mode (`astro/tsconfigs/strict`). Contribute with the same discipline:

- **Types:** define `interface` for object shapes; prefer discriminated unions of string literals for fixed sets (see `TokenType`).
- **Naming:** `CamelCase` types/interfaces/classes; `camelCase` variables, functions, and hooks; `UPPER_SNAKE_CASE` for module-level constants (see `MIN_ZOOM`, `MAX_ZOOM`, `STYLES`).
- **Classes:** use `private` for internal state; type constructor params explicitly.
- Avoid `any`. The parser/translator tests intentionally use `any` casts in test helpers only — production code stays fully typed.
- Export the smallest useful surface: types and functions `export`ed from `index.ts` barrels, with default implementations private.

## Astro Conventions

- **Static-first:** write `.astro` components unless client interactivity is genuinely needed; reach for React only for islands.
- **Props contract:** declare `export interface Props` in the frontmatter and destructure with typed defaults:

  ```astro
  ---
  export interface Props {
    title: string;
    description?: string;
  }
  const { title, description = 'Default' } = Astro.props;
  ---
  ```

- **Hydration directives:** use the lightest directive that works — `client:visible` for deferred UI, `client:idle` for lower-priority, `client:load` for immediately visible interactive islands, `client:only` only when skipping the server render is intentional.
- **Slots & fragments:** use `<slot />` / named slots; use `<Fragment>` when passing multiple elements without a wrapper element.
- File names are `PascalCase` for components (`Hero.astro`, `Footer.astro`) and `kebab-case` for pages.

## React Conventions

Interactive components live in `src/components/react/` and carry a `'use client'` directive:

- **Hooks first:** `useState` for local state, `useCallback` + `useMemo` for stable references, `useRef` for DOM/transient values, `useEffect` for side effects with proper cleanup.
- **Functional updates:** always use the updater form when the next state depends on the previous (`setCurrentStep((prev) => prev + 1)`).
- **Accept dependencies, don't create them:** pass collaborators/values through props rather than instantiating them inside the component — this is what keeps islands testable.
- **Props are serializable:** React islands receive only plain data from Astro (no functions or class instances). Deserialize AST nodes at the component boundary.
- **Accessible interactivity:** every button/control has a visible label or `aria-label`, correct `aria-*` attributes, and visible focus styles (`focus-visible:ring-*`).

## Styling with Tailwind CSS v4

- **No `tailwind.config.js`.** Tailwind v4 is configured in CSS via `@import "tailwindcss"` and the `@theme` directive in `src/styles/global.css`.
- Use **design tokens** from `@theme` (`--color-surface`, `--color-ink`, `--color-accent`, `--color-accent-hover`, `--color-border`, etc.) instead of hardcoded hex.
- Utility classes are the primary styling approach; scoped component `<style>` blocks for bespoke component CSS and keyframes.
- **Light-only theme is a decision, not an omission:** dark mode is intentionally out of scope (`color-scheme: light`).
- Prefer CSS-only animation; always respect `prefers-reduced-motion` (a global override already exists in `global.css`).

## Testing

- Framework: **Vitest** with `@testing-library/react` for React component tests (`jsdom` per-file via `// @vitest-environment jsdom`).
- Style: `describe` / `it` blocks from `vitest`; assert on public behavior, not implementation details.
- **Test coverage is treated as a feature.** Every new function or node type in the parser/translator should land with tests; new functions added anywhere in `functionDocs`/`functionArgs` must include their summary/returns to pass the full-coverage invariant test.
- Keep tests deterministic — no unchecked randomness or timers that depend on wall-clock time (use Vitest fake timers).
- Run the full suite (`npm run test`) before finishing a change; a green build plus a passing suite is the internal quality bar.

## Accessibility & Design Compliance

- Semantic HTML: `header`, `nav`, `main`, `article`, `footer`; correct heading hierarchy; landmark landmarks with `aria-labelledby` where useful.
- Keyboard: every interactive element reachable and operable via Tab/Enter/Escape; a visible skip-to-content link is on every page (see `Layout.astro`).
- Contrast: maintain WCAG AA contrast (4.5:1 normal text, 3:1 large text). Color coding is supported by text/labels and is not the only channel.
- Hidden state: `aria-hidden="true"` for decorative elements only; `inert` + `aria-hidden` on collapsed subtrees; `aria-expanded`/`aria-pressed` state on toggle buttons.
- Screen readers: test UI changes where possible; every change should preserve the accessible experience.

## Commit & Review Practices

- Commit messages use the [Conventional Commits](https://www.conventionalcommits.org/) style observed in `git log`: `feat(scope): description`, `fix: ...`, `refactor(arch): ...`, `docs: ...`, `chore: ...`, etc.
  - Example: `feat(visualizer): add zoom controls to the outline panel`.
- Keep commits small and focused — one logical change per commit, with the summary line ≤ ~72 characters; use the body for context.
- PRs: small, reviewable diffs; address requested changes or respond with your reasoning rather than pushing silently.
- New features **must** be accompanied by tests at the appropriate layer (parser / translator / component) unless you explain in the PR why not.

## Changes to This Document

This guide reflects the codebase as it stands. It may change:

- Propose improvements by opening an issue or a PR that updated this file alongside the change.
- When re-analyzing the codebase programmatically, the `write-standards` skill regenerates standards from source files — treat that output as a starting draft, and reconcile it with this document before adopting wholesale.

Thank you for contributing!