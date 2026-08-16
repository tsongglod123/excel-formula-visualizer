---
name: test-and-fix
description: Run the test suite, diagnose any failures with a red-loop → hypothesis → fix → regression cycle, and verify everything passes. Use when fixing bugs, failing tests, or QA'ing a change.
---

# Workflow: Test and Fix

## Purpose

Run the project's tests and type checks, identify failures, fix the root causes, and verify everything passes. This workflow ensures code quality is maintained before any change is committed.

## Steps

1. **Run the test suite**
   - Execute `npm run test`
   - Note the exit code and any failing test names

2. **Run type checks**
   - Execute `npx astro check`
   - Note any TypeScript or Astro type errors

3. **Diagnose failures**
   - If tests fail, read the failing test files to understand expected behavior
   - Read the corresponding source files (`src/lib/parser.ts`, `src/lib/translate.ts`, etc.)
   - Use the `diagnosing-bugs` skill (red-loop → minimise → hypothesise → fix → regression) when the root cause isn't obvious
   - Use `sequential-thinking` MCP to break down complex failures into logical steps
   - Identify the **root cause** — do not just patch symptoms

4. **Fix the issues**
   - Apply fixes to the source code
   - Follow `.cline/rules/coding-conventions.md` for style and structure
   - Use `astro-best-practices` skill when fixing Astro components (`astro-components.md` rule)
   - Use `vercel-react-best-practices` skill when fixing React components (`react-components.md` rule)
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