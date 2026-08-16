---
paths:
  - "src/components/astro/**"
  - "src/pages/**"
  - "src/layouts/**"
---

# Astro Components

Guidance for Astro components, pages, and layouts. Loads only when editing Astro files.

## Component Architecture

- **Astro Components** — All UI components are `.astro` files with frontmatter (`---`) for logic and template for markup
- **PascalCase** — Component filenames and exported names (e.g., `FeatureCard.astro`, `Hero.astro`)
- **One component per file** — Each `.astro` file contains a single component
- **Props** — Define props with TypeScript interface in frontmatter, export via `Astro.props`

## Props Interface

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

## Slots

Use `<slot />` for injecting child content into components:
- **Default slot**: `<slot />` — renders all unnamed children
- **Named slots**: `<slot name="header" />` — matched via `slot="header"` attribute on child elements
- **Fallback content**: `<slot><p>Default fallback</p></slot>` — shown when no children are passed
- **Slot transfer**: Pass slots through nested components using both `name` and `slot` attributes: `<slot name="head" slot="head" />`

## Fragment

Use Astro's `<Fragment>` component (or short syntax `<>`) to pass multiple HTML elements into a named slot without a wrapping `<div>`:

```astro
<Fragment slot="body">
  <tr><td>Item 1</td></tr>
  <tr><td>Item 2</td></tr>
</Fragment>
```

## Layout Components

- Provide `<html>`, `<head>`, `<body>` page shell with `<slot />` for content injection
- Accept props via `Astro.props` (e.g., `title`, `description`)
- Place in `src/layouts/` directory (convention)
- Can be nested (layout wrapping another layout)

## Hydration of UI Framework Components

Use `client:*` directives to control when React (and other UI framework) islands hydrate:

| Directive | Priority | Use Case |
|-----------|----------|----------|
| `client:load` | High | Immediately-visible interactive elements |
| `client:idle` | Medium | Lower-priority elements; hydrates after page load |
| `client:visible` | Low | Below-the-fold elements; hydrates when scrolled into viewport |
| `client:media` | Low | Elements visible only at certain screen sizes |

## View Transitions & Client-Side Routing

- Import `<ClientRouter />` from `astro:transitions` in shared layouts to enable client-side navigation with animated page transitions
- Use `transition:name` directive to associate elements across pages for smooth animations
- Use `transition:animate` with built-in options: `fade` (default), `slide`, `initial`, `none`
- Use `transition:persist` to keep elements across navigations (e.g., persistent audio/video players)
- Astro automatically respects `prefers-reduced-motion` and disables all view transition animations

## Accessibility

- Use semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<article>`, etc.)
- Provide ARIA labels and descriptions where needed
- Ensure keyboard navigation works for all interactive elements
- Maintain sufficient color contrast (`WCAG AA` minimum)
- Test with screen readers when making UI changes
- Use `aria-hidden="true"` on decorative elements and icons
- Always include a `<title>` in each page for accessibility (especially with client-side routing)