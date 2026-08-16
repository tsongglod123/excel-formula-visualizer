---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/__tests__/**"
  - "src/test/**"
  - "vitest.config.*"
---

# Testing

Testing standards and workflow. Loads only when editing test files or test config.

## Framework & Style

- **Framework**: Vitest with `@testing-library/react` for React component tests
- React component tests use `jsdom` via a per-file `// @vitest-environment jsdom` pragma
- Style: `describe` / `it` blocks from `vitest`; assert on public behavior, not implementation details
- Keep tests deterministic — no unchecked randomness or wall-clock-dependent timers (use Vitest fake timers)

## Coverage Expectations

- **Test coverage is treated as a feature.** Every new function or node type in the parser/translator should land with tests
- New functions added anywhere in `functionDocs`/`functionArgs` must include their summary/returns to pass the full-coverage invariant test
- Test edge cases and error handling, not just happy paths

## Commands

| Command | Action |
| :------ | :----- |
| `npm run test` | Run the Vitest suite |
| `npm run test:coverage` | Run Vitest with coverage report |

## Verification

Before finishing a change, run:
1. `npm run test` — all tests must pass
2. `npx astro check` — no type errors
3. `npm run build` — production build succeeds