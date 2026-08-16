---
paths:
  - "src/components/react/**"
  - "**/*.test.tsx"
---

# React Components

Guidance for React components (visualizer islands) and their tests. Loads only when editing React files.

## Component Structure

- Use `.tsx` extension for React components
- Place React components in `src/components/react/`
- Use `'use client'` directive for components that need client-side interactivity

## State Management

- Use `useState` for local component state (e.g., collapsible groups, hover state)
- Use `useReducer` for complex state logic (e.g., step-by-step mode)
- Use `useRef` for DOM references and transient values
- Use `useMemo`/`useCallback` sparingly — only for expensive computations

## Performance

Follow `vercel-react-best-practices` skill when writing or reviewing React components:

- **Eliminate waterfalls**: Use `Promise.all()` for independent async operations
- **Bundle size**: Avoid barrel file imports, use dynamic imports for heavy components
- **Re-render optimization**: Calculate derived state during rendering, use functional `setState` updates
- **Client-side data fetching**: Use passive event listeners, deduplicate global listeners

## Hydration with Astro

- Use `client:load` for immediately-visible interactive React components
- Use `client:idle` for lower-priority interactive elements
- Use `client:visible` for below-the-fold interactive elements
- Pass serializable props only (no functions, no complex objects)
- AST data flows from Astro server-side render → serialized as JSON → passed to React client components via props; deserialize at the component boundary