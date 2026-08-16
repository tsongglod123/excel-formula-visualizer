# Coding Conventions

Universal conventions that apply to all code in this project. Astro- and React-specific guidance lives in the scoped rules (`astro-components.md`, `react-components.md`) which load only when you touch those files.

## TypeScript

- Use TypeScript for all component logic and data structures
- Define interfaces for props, AST nodes, and translation rules
- Use strict mode (`strict: true` in tsconfig)
- Avoid `any` — prefer explicit types or `unknown`

## CSS & Styling

- **Tailwind CSS 4** — Use utility classes as the primary styling approach
- **CSS Variables** — Define theme tokens in `global.css` using `@theme` directive
- **Responsive Design** — Mobile-first approach with Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`)
- **Custom Styles** — Use `@apply` sparingly; prefer inline utility classes
- **No tailwind.config.js** — Tailwind v4 is CSS-based, configure via `@import "tailwindcss"` in `global.css`

## Accessibility

- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`
- ARIA: Use `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-hidden="true"` for decorative elements
- Keyboard: All interactive elements must be reachable and operable via keyboard (Tab, Enter, Escape, arrow keys)
- Focus: Visible focus indicators, logical tab order, focus trapping for modals
- Color: Maintain WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- Screen readers: Test with screen readers for UI changes; use `sr-only` for visually hidden but accessible content

## Frontend Design Guidelines

Always follow the `frontend-design` skill when creating new components, pages, or layouts:

- **Bold Aesthetic Direction** — Choose a distinctive visual direction (minimalist, maximalist, editorial, etc.) and execute it precisely. Avoid generic AI aesthetics.
- **Typography** — Use distinctive, characterful font choices. Avoid generic fonts like Arial, Inter, Roboto for display. Pair display fonts with refined body fonts.
- **Color & Theme** — Commit to a cohesive palette using CSS variables. Use dominant colors with sharp accents. Avoid timid, evenly-distributed palettes.
- **Motion** — Use CSS animations for micro-interactions and page-load reveals. Favor CSS-only solutions. Use staggered `animation-delay` for orchestrated entrances.
- **Spatial Composition** — Leverage asymmetry, overlap, generous negative space, and grid-breaking elements for visual interest.
- **Backgrounds** — Add atmosphere with gradient meshes, noise textures, geometric patterns, layered transparencies, or subtle grain overlays instead of flat solid colors.

## Web Design Compliance

When reviewing UI, follow the `web-design-guidelines` skill:

1. Fetch the latest guidelines from: `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
2. Review files against all rules
3. Output findings in `file:line` format

## File Organization

- **Astro components** live in `src/components/astro/`; **React components** in `src/components/react/`
- Page layout shell lives in `src/layouts/` (`Layout.astro`)
- Route pages live in `src/pages/` (`index.astro`, `visualize.astro`, etc.)
- Global styles live in `src/styles/` (`global.css`)
- Global CSS variables/design tokens are defined in `global.css` via `@theme`