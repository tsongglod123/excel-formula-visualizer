# Development

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
| `npm run preview` | Preview production build locally |
| `npm run astro ...` | Run Astro CLI commands (`astro add`, `astro check`, etc.) |
| `npm run test` | Run Vitest tests |
| `npm run test:coverage` | Run Vitest with coverage report |

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
| `src/components/` | Reusable Astro or UI framework components (convention) |
| `src/layouts/` | Page layout components providing `<html>`, `<head>`, `<body>` shell with `<slot />` (convention) |
| `src/styles/` | Global CSS files (convention) |
| `public/` | Unprocessed static assets (fonts, favicon, PDFs) — copied as-is to build |

## View Transitions & Client-Side Routing

- Import `<ClientRouter />` from `astro:transitions` in shared layouts to enable client-side navigation with animated page transitions
- Use `transition:name` directive to associate elements across pages for smooth animations
- Use `transition:animate` directive with built-in options: `fade` (default), `slide`, `initial`, `none`
- Use `transition:persist` to keep elements across navigations (e.g., persistent audio/video players)
- Astro automatically respects `prefers-reduced-motion` and disables all view transition animations

## Client Directives for UI Framework Components

When using UI framework components (React, Vue, Svelte), use `client:*` directives to control hydration:

| Directive | Priority | Use Case |
|-----------|----------|----------|
| `client:load` | High | Immediately-visible interactive elements |
| `client:idle` | Medium | Lower-priority elements; hydrates after page load |
| `client:visible` | Low | Below-the-fold elements; hydrates when scrolled into viewport |
| `client:media` | Low | Elements visible only at certain screen sizes |

## Accessibility

- Use semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<article>`, etc.)
- Provide ARIA labels and descriptions where needed
- Ensure keyboard navigation works for all interactive elements
- Maintain sufficient color contrast (WCAG AA minimum)
- Test with screen readers when making UI changes
- Use `aria-hidden="true"` on decorative elements and icons
- Always include a `<title>` in each page for accessibility (especially with client-side routing)