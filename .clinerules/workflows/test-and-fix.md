# Workflow: Test and Fix

## Purpose

Run the project's test suite, identify failures, fix the root causes, and verify everything passes. This workflow ensures code quality is maintained before any changes are committed.

## Skills & MCP Tools

- **MCP:** `sequential-thinking` — Use for analyzing complex test failures step-by-step when the root cause isn't immediately obvious
- **MCP:** `astro-docs` — Use when failures relate to Astro framework behavior or configuration
- **Skill:** `astro-best-practices` — Use when fixing issues in Astro components to ensure performant, accessible defaults
- **Skill:** `vercel-react-best-practices` — Use when fixing issues in React components to ensure optimal performance patterns

## Steps

1. **Run the test suite**
   - Execute `npm run test`
   - Note the exit code and any failing test names

2. **Run type checks**
   - Execute `npx astro check`
   - Note any TypeScript or Astro type errors

3. **Analyze failures**
   - If tests fail, read the failing test files to understand expected behavior
   - Read the corresponding source files (`src/lib/parser.ts`, `src/lib/translate.ts`, etc.)
   - Use `sequential-thinking` MCP tool to break down complex failures into logical steps
   - Identify the **root cause** — do not just patch symptoms

4. **Fix the issues**
   - Apply fixes to the source code
   - Follow `.clinerules/coding-conventions.md` for style and structure
   - Use `astro-best-practices` skill when fixing Astro components
   - Use `vercel-react-best-practices` skill when fixing React components
   - Consult `astro-docs` MCP for Astro-specific questions

5. **Re-run tests**
   - Execute `npm run test` again
   - Confirm all tests pass
   - If failures remain, repeat steps 3–5

6. **Re-run type checks**
   - Execute `npx astro check` again
   - Confirm no type errors remain

7. **Verify the build**
   - Execute `npm run build` to confirm the production build succeeds

8. **Report results**
   - Summarize what was fixed and why
   - List the test count and pass/fail status
   - Note any files that were modified