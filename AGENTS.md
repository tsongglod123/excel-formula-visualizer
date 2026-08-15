## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Skills & MCP References

Invoke a skill or MCP tool when the situation matches its trigger. Skills are loaded on demand (not added to every prompt), so referencing the right one keeps work consistent with project conventions.

### Code & Architecture skills
- `codebase-design` — when designing or restructuring a module, deciding where a seam goes, or making code more testable/AI-navigable. Use the deep-module vocabulary (module/interface/depth/seam/adapter). _New, always available._
- `code-review` — before merging a branch/PR or when asked to review a diff; two-axis (standards + spec) parallel review. _New._
- `diagnosing-bugs` — when debugging a hard bug or performance regression; follow the red-loop → minimise → hypothesise → fix → regression-test cycle. _New._
- `vercel-react-best-practices` — when writing/reviewing React components (hydration, bundle size, re-renders).
- `astro-best-practices` — Astro defaults (static-first, hydration directives, a11y, perf).

### Authoring skills
- `write-coding-standards-from-file` — when generating/re-viewing a coding-standards doc (e.g. `CONTRIBUTING.md`) from existing source. _Project-local._
- `add-integration`, `content-collection`, `create-component`, `docs-lookup` — Astro wiring, content schemas, component scaffolding, and doc lookups.
- `frontend-design`, `web-design-guidelines`, `commit-message-storyteller` — distinctive UI direction, web-interface guideline compliance, narrative Conventional Commit messages.
- `documentation-writer`, `microsoft-docs`, `find-skills` — technical writing, Microsoft docs lookup, skill discovery.

### MCP tools
- `sequential-thinking` — for analysis that benefits from step-by-step reasoning (used by the commit-and-push workflow to classify a diff).
- `astro-docs` search / `microsoft-docs` search+fetch — official framework / reference lookups.
- `excel-mcp` (+ `excel-cli`) — Excel workbook automation (only if the task involves producing/updating Excel files).

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
