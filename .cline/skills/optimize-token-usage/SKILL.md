---
name: optimize-token-usage
description: Minimize token consumption during an interaction — efficient file reads, batched searches, bounded terminal output, and minimal precise edits. Use whenever working in the codebase to keep context lean and cost low.
---

# Workflow: Optimize Token Usage

## Purpose

Token spend is dominated by reading, searching, and terminal output — not by the edits themselves. Staying lean keeps the context window uncluttered, reduces errors from stale/dumped content, and lowers cost. These habits apply to every interaction, not just large refactors.

## Principles

- **Batch, don't sprinkle.** One call that does several things costs less than several calls that each do one thing.
- **Narrow beats broad.** Pull only what you need; broad pulls are truncated (~48k) and much of it is wasted.
- **Don't re-fetch what's already in context.** Re-reading a file, re-running a check, or re-rendering a result you already have is pure waste.
- **Edit the delta, not the document.** Precision edits keep diffs small and context lean.

## Tool Preference

Choose the tool with the lowest token cost for the operation. **MCP is an optimization; Cline native is the always-available baseline. Pick exactly one per operation — never issue an attempt and its fallback together.**

| Situation | Prefer | Fallback (native) | Why preferred |
| --- | --- | --- | --- |
| Map project structure (nesting, exclusions) | `filesystem__directory_tree` (with `excludePatterns`) | read a few dirs / `run_commands` listing | Recursive tree in one cheap call; no opens needed |
| Gauge file sizes before reading | `filesystem__list_directory_with_sizes` | `run_commands` size-spot-check | Avoid pulling a huge file you don't need |
| Grab only first/last N lines | `filesystem__read_text_file` with `head` / `tail` | `read_files` `start_line`/`end_line` after finding the end | No need to know line count first |
| Find files by name / glob | `filesystem__search_files` (`**/*.ext`) | `search_codebase` on a narrow filename pattern | Purpose-built filename globbing |
| Single-file metadata (size/mtime) | `filesystem__get_file_info` | `filesystem__list_directory_with_sizes` | One-cell, cheapest metadata read |
| Read many full files at once | `read_files` (batched in one call) | — | Returns content directly, batched, always available |
| Read a specific line range | `read_files` `start_line` / `end_line` | — | Equal-or-greater control than MCP |
| Regex **content** search | `search_codebase` (narrow patterns) | — | MCP `search_files` is glob-on-filename, not content regex |
| Tests / build / git / any shell | `run_commands` (bounded output) | — | No MCP equivalent |
| Precise edits | native `edit_file` (`oldText`/`newText`) | — | Consistency with the primary edit path |

## Fallback & Caveats

- **Fallback silently, without retry.** If filesystem MCP is unavailable (server not connected, path outside its allowed directories, or it returns a resource/base64 instead of text), use the native tool in the table above. Do not emit both calls for the same job — that duplicates token spend.
- **Text, not media:** for text content use `filesystem__read_text_file` / `read_multiple_files`. `filesystem__read_media_file` returns base64/resource and should only be used for images/audio.
- **Allowed-directory limits:** filesystem MCP only reads inside its configured allow-list. When working from the repo root, native tools are the safe default.

## Steps

1. **Gather context efficiently**
   - Consult the **Tool Preference** table and pick the single cheapest tool for each operation; batch independent reads/searches into one call, and issue them in the **same response** as other independent tool calls so tool boilerplate isn't repeated.
   - Read only the needed line ranges (`start_line` / `end_line`) instead of whole files; page through a long file with explicit ranges rather than re-reading from the top.
   - Prefer `search_codebase` with narrow regex (or `filesystem__search_files` for name globs) over reading whole files. Bundle several narrow patterns in one call.
   - Never re-read a file that is already in context from this interaction.

2. **Run commands with bounded output**
   - Batch independent `run_commands` into one call.
   - Keep output short: `git --no-pager`, `--stat`, pipe to `count`/`head`/`tail`. Never run a bare `git diff`/`git log` on a large change (it paginates and dumps).
   - Filter before the truncation threshold so you never pay for output you won't use.

3. **Make minimal, precise edits**
   - Use `edit_file` with exact `oldText` / `newText` for targeted changes; don't rewrite whole files when only a section changes.
   - Write complete but **concise** content — no comments that merely restate the code.
   - Batch non-overlapping edits to different files or non-overlapping regions in one response.
   - Avoid cosmetic-only churn (spacing, reordering) — it wastes tokens and inflates the diff.

4. **Verify efficiently**
   - Run the verification suite once (`npm run test`, `npx astro check`, `npm run build`) rather than piecemeal.
   - On failure, read only the failing lines, not the entire log.
   - Don't re-run passing checks after unrelated changes unless they could plausibly be affected.

5. **Manage context**
   - Read the memory bank once and retain it; don't re-read mid-task.
   - Cite paths + line ranges rather than quoting large blocks into the running context.
   - When reporting, summarize the change instead of dumping whole files.

## Anti-Patterns

- Whole-file dumps when a targeted range or pattern would do.
- Redundant re-reads of files already in context.
- Bare paginating `git` commands (`git diff`, `git log`) on large changes.
- Running every command in its own call instead of batching independent ones.
- Copying large blocks verbatim into the conversation instead of referencing path + line range.
- Rewriting a whole file (or whole section) to achieve a two-line change.