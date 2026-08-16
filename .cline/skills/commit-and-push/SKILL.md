---
name: commit-and-push
description: Stage, commit with a narrative Conventional Commit message, and push to GitHub. Use when the user asks to commit, push, or save changes.
---

# Workflow: Commit and Push

## Purpose

Commit and push changes to GitHub with a well-crafted, narrative commit message. This workflow ensures changes are committed with clear intent and pushed successfully.

## Terminal Output (important)

Never leave a long blob of text sitting in the terminal — especially nothing that requires manually pressing `Q` to exit a `(END)` pager.

- Run git commands with `git --no-pager ...` so they never open an interactive pager.
- Prefer short, bounded output: `git status --short`, `git diff --stat`, `git log -n` rather than full dumps.
- Do **not** run a bare `git diff` (or `git log`) on a large change set — it can dump an enormous diff and block on `(END)`. If you need to inspect the actual content, use the file-reader tool on the specific changed files instead, or pipe to a count/head (e.g. `git --no-pager diff --stat`).
- Never use terminal pagers (`less`, `more`, interactive `git log`). If output is potentially long, prefer a tool that returns content directly to the agent instead of the terminal.

## Skills & MCP Tools

- **Skill:** `commit-message-storyteller` — Use to generate narrative commit messages that explain WHY a change was made, following Conventional Commits format
- **MCP:** `sequential-thinking` — Use to analyze the diff and determine the appropriate commit type and scope

## Steps

1. **Check the current state**
   - Execute `git --no-pager status --short` to see modified, staged, and untracked files
   - Execute `git --no-pager diff --stat` for a short overview of change size
   - For the content itself, read the changed files with the file-reader tool (do NOT run a bare `git diff` — it may paginate/emit a huge dump)

2. **Review the changes**
   - Read any new files to understand their purpose
   - Read modified files to understand what changed
   - Use `sequential-thinking` MCP to analyze the overall impact
   - Determine the commit type: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`, `style:`, `perf:`

3. **Stage the changes**
   - Execute `git add -A` to stage all changes
   - Verify with `git --no-pager status --short` that everything is staged correctly

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
   - Execute `git --no-pager status --short` — working tree should be clean
   - Execute `git --no-pager log --oneline -n 1` — confirm the new commit is at HEAD
   - Execute `git --no-pager log origin/main --oneline -n 1` — confirm the remote matches local

8. **Report the result**
   - Summarize the commit and what it contains
   - List the commit hash and message
   - Confirm the push to GitHub was successful