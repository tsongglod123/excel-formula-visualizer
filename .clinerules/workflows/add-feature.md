# Workflow: Add Feature

## Purpose

Add a new feature to the project following established conventions. This workflow ensures features are implemented with proper architecture, tests, and documentation updates.

## Skills & MCP Tools

- **Skill:** `create-component` — Use when creating new Astro components, pages, or layouts
- **Skill:** `frontend-design` — Use when building UI components or pages to ensure distinctive, production-grade design
- **Skill:** `astro-best-practices` — Use to apply performant, accessible, and maintainable defaults
- **Skill:** `vercel-react-best-practices` — Use when writing or refactoring React components for optimal performance
- **Skill:** `microsoft-docs` — Use when adding Excel function translations to understand official function behavior
- **MCP:** `microsoft-learn` — Use to search official Microsoft documentation for Excel function semantics, argument names, and edge cases
- **MCP:** `astro-docs` — Use for Astro framework questions (routing, components, integrations)
- **MCP:** `sequential-thinking` — Use for complex feature design decisions

## Steps

1. **Read the memory bank**
   - Read ALL files in `memory-bank/` to understand project context
   - Read `projectbrief.md` for core goals and scope
   - Read `systemPatterns.md` for architecture and design patterns
   - Read `activeContext.md` for current work focus
   - Read `progress.md` for what's done and what's planned

2. **Understand the feature request**
   - Clarify the feature scope and requirements
   - Identify which of the three core goals it serves: Parse, Visualize, or Explain
   - Use `sequential-thinking` MCP for complex design decisions

3. **Plan the implementation**
   - Determine which files need to be created or modified
   - Follow `.clinerules/coding-conventions.md` for component architecture
   - Use `create-component` skill for new Astro components
   - Use `frontend-design` skill for UI components and pages
   - Use `vercel-react-best-practices` skill for React components

4. **Research Excel functions (if applicable)**
   - If adding function translations, use `microsoft-docs` skill and `microsoft-learn` MCP
   - Search for official argument names and behavior
   - Verify edge cases and error handling

5. **Implement the feature**
   - Create/modify source files following project conventions
   - Add TypeScript interfaces for props and data structures
   - Use Tailwind CSS utility classes for styling
   - Follow accessibility guidelines (semantic HTML, ARIA, keyboard navigation)

6. **Add tests**
   - Write unit tests for new parser/translator logic in `src/lib/`
   - Follow existing test patterns in `parser.test.ts` and `translate.test.ts`
   - Test edge cases and error handling

7. **Verify the implementation**
   - Run `npm run test` — all tests must pass
   - Run `npx astro check` — no type errors
   - Run `npm run build` — production build succeeds
   - Use `astro-best-practices` skill to review for performance/accessibility issues

8. **Update the memory bank**
   - Update `activeContext.md` with the new feature and recent changes
   - Update `progress.md` with completed work
   - Update `systemPatterns.md` if architecture patterns changed
   - Update `techContext.md` if dependencies or tech stack changed

9. **Report the result**
   - Summarize the feature and how it was implemented
   - List all files created or modified
   - Note test coverage and verification results