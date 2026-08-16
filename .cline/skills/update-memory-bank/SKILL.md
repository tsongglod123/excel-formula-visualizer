---
name: update-memory-bank
description: Review and update all memory-bank files to reflect the current project state. Use when the user asks to update the memory bank or after significant changes.
---

# Workflow: Update Memory Bank

## Purpose

Review and update all memory bank files (`memory-bank/`) to reflect the current state of the project. This keeps Cline's documentation accurate and complete across sessions.

## Steps

1. **Read ALL memory bank files**
   - Read `memory-bank/projectbrief.md` — core requirements, goals, and scope
   - Read `memory-bank/productContext.md` — why the project exists and how it should work
   - Read `memory-bank/activeContext.md` — current work focus and recent changes
   - Read `memory-bank/systemPatterns.md` — architecture and design patterns
   - Read `memory-bank/techContext.md` — technologies and dependencies
   - Read `memory-bank/progress.md` — what works and what's left to build

2. **Review recent changes**
   - Check `git log --oneline -10` for recent commits
   - Check `git status` for uncommitted changes
   - Check `git diff` for modified files
   - Use `sequential-thinking` MCP to analyze the impact of changes

3. **Update `activeContext.md`**
   - Record the current work focus
   - Document recent changes and their rationale
   - Note active decisions and considerations
   - Capture important patterns and preferences discovered
   - List next steps

4. **Update `progress.md`**
   - Mark completed features as done
   - Update the current status section
   - Add new planned work items
   - Document known issues and their status
   - Note the evolution of project decisions

5. **Update `systemPatterns.md` (if needed)**
   - Update if architecture or design patterns changed
   - Update if component relationships or critical implementation paths changed

6. **Update `techContext.md` (if needed)**
   - Update if dependencies, development setup, technical constraints, or tool usage changed

7. **Update `productContext.md` (if needed)**
   - Update if the problem the project solves or user experience goals changed

8. **Update `projectbrief.md` (if needed)**
   - Update if core requirements, scope, or success metrics changed

9. **Verify consistency**
   - Use `documentation-writer` skill to review structure and clarity
   - Ensure all files are consistent with each other
   - Ensure no outdated or contradictory information remains
   - Confirm the memory bank accurately reflects the current project state

10. **Report the result**
    - Summarize which files were updated and why
    - Note any significant changes to project context