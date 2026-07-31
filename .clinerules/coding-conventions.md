# Coding Conventions

## Component Architecture

- **Astro Components** — All UI components are `.astro` files with frontmatter (`---`) for logic and template for markup
- **PascalCase** — Component filenames and exported names (e.g., `FeatureCard.astro`, `Hero.astro`)
- **One component per file** — Each `.astro` file contains a single component
- **Props** — Define props with TypeScript interface in frontmatter, export via `Astro.props`

## Astro Component Patterns

### Props Interface
Define props using a TypeScript `Props` interface in the component frontmatter. Astro automatically picks up the `Props` interface for type checking:

```astro
---
interface Props {
  title: string;
  description?: string;
  children?: any;  // if component accepts slotted content
}

const { title, description = "Default description" } = Astro.props;
---
```

### Slots
Use `<slot />` for injecting child content into components:
- **Default slot**: `<slot />` — renders all unnamed children
- **Named slots**: `<slot name="header" />` — matched via `slot="header"` attribute on child elements
- **Fallback content**: `<slot><p>Default fallback</p></slot>` — shown when no children are passed
- **Slot transfer**: Pass slots through nested components using both `name` and `slot` attributes: `<slot name="head" slot="head" />`

### Fragment
Use Astro's `<Fragment>` component (or short syntax `<>`) to pass multiple HTML elements into a named slot without a wrapping `<div>`:

```astro
<Fragment slot="body">
  <tr><td>Item 1</td></tr>
  <tr><td>Item 2</td></tr>
</Fragment>
```

### Layout Components
- Provide `<html>`, `<head>`, `<body>` page shell with `<slot />` for content injection
- Accept props via `Astro.props` (e.g., `title`, `description`)
- Place in `src/layouts/` directory (convention)
- Can be nested (layout wrapping another layout)

## React Component Patterns

### Component Structure
- Use `.jsx` or `.tsx` extensions for React components
- Place React components in `src/components/` alongside Astro components
- Use `'use client'` directive for components that need client-side interactivity

### State Management
- Use `useState` for local component state (e.g., collapsible groups, hover state)
- Use `useReducer` for complex state logic (e.g., step-by-step mode)
- Use `useRef` for DOM references and transient values
- Use `useMemo`/`useCallback` sparingly — only for expensive computations

### Performance (Follow `vercel-react-best-practices` skill)
- **Eliminate waterfalls**: Use `Promise.all()` for independent async operations
- **Bundle size**: Avoid barrel file imports, use dynamic imports for heavy components
- **Re-render optimization**: Calculate derived state during rendering, use functional `setState` updates
- **Client-side data fetching**: Use passive event listeners, deduplicate global listeners

### Hydration with Astro
- Use `client:load` for immediately-visible interactive React components
- Use `client:idle` for lower-priority interactive elements
- Use `client:visible` for below-the-fold interactive elements
- Pass serializable props only (no functions, no complex objects)

## Frontend Design Guidelines

Always follow the `frontend-design` skill when creating new components, pages, or layouts:

- **Bold Aesthetic Direction** — Choose a distinctive visual direction (minimalist, maximalist, editorial, etc.) and execute with precision. Avoid generic AI aesthetics.
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

## Accessibility

- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`
- ARIA: Use `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-hidden="true"` for decorative elements
- Keyboard: All interactive elements must be reachable and operable via keyboard (Tab, Enter, Escape, arrow keys)
- Focus: Visible focus indicators, logical tab order, focus trapping for modals
- Color: Maintain WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- Screen readers: Test with screen readers for UI changes; use `sr-only` for visually hidden but accessible content

## CSS & Styling

- **Tailwind CSS 4** — Use utility classes as the primary styling approach
- **CSS Variables** — Define theme tokens in `global.css` using `@theme` directive
- **Responsive Design** — Mobile-first approach with Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`)
- **Custom Styles** — Use `@apply` sparingly; prefer inline utility classes
- **No tailwind.config.js** — Tailwind v4 is CSS-based, configure via `@import "tailwindcss"` in `global.css`

## TypeScript

- Use TypeScript for all component logic and data structures
- Define interfaces for props, AST nodes, and translation rules
- Use strict mode (`strict: true` in tsconfig)
- Avoid `any` — prefer explicit types or `unknown`

## File Organization

```
src/
├── components/   # Reusable Astro components
├── layouts/      # Page layouts (Layout.astro)
├── pages/        # Route pages (index.astro, visualize.astro, etc.)
├── styles/       # Global CSS (global.css)
└── assets/       # Static assets (images, icons)