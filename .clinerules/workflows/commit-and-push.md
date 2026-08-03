# Workflow: Commit and Push

## Purpose

Commit and push changes to GitHub with a well-crafted, narrative commit message. This workflow ensures changes are committed with clear intent and pushed successfully.

## Skills & MCP Tools

- **Skill:** `commit-message-storyteller` — Use to generate narrative commit messages that explain WHY a change was made, following Conventional Commits format
- **MCP:** `sequential-thinking` — Use to analyze the diff and determine the appropriate commit type and scope

## Steps

1. **Check the current state**
   - Execute `git status` to see modified, staged, and untracked files
   - Execute `git diff --stat` for an overview of changes
   - Execute `git diff` to review the actual content changes

2. **Review the changes**
   - Read any new files to understand their purpose
   - Read modified files to understand what changed
   - Use `sequential-thinking` MCP to analyze the overall impact
   - Determine the commit type: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`, `style:`, `perf:`

3. **Stage the changes**
   - Execute `git add -A` to stage all changes
   - Verify with `git status --short` that everything is staged correctly

4. **Generate the commit message**
   - Use `commit-message-storyteller` skill to craft a narrative commit message
   - Follow Conventional Commits format: `type(scope): description`
   - Include a body explaining WHY the change was made, not just what changed
   - Keep the summary line under 72 characters

5. **Commit the changes**
   - Execute `git commit -m "..."` with the generated message
   - For multi-line messages, use `git commit -m "summary" -m "body"`

6. **Push to GitHub**
   - Execute `git push origin main`
   - Confirm the push succeeds without errors

7. **Verify the push**
   - Execute `git status` — working tree should be clean
   - Execute `git log --oneline -1` — confirm the new commit is at HEAD
   - Execute `git log origin/main --oneline -1` — confirm the remote matches local

8. **Report the result**
   - Summarize the commit and what it contains
   - List the commit hash and message
   - Confirm the push to GitHub was successful