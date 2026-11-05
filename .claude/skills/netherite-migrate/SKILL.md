---
name: netherite-migrate
description: Bring the docs, runbooks, decision records and agent conventions of an existing project into Netherite: survey the repository, ask the person at each choice, plan the work as a project with tasks, and import it in reviewed batches. Use when asked to migrate, import or adopt Netherite in a repository that already has documentation.
---

# Bring an existing project into Netherite

This skill needs two things beyond the `netherite` MCP tools: to read files in the repository, and to run `netherite import`. If you cannot run commands, say so, write the batch file, and give the person the command to run. Work in phases and stop at every question: the person decides, you recommend. Never commit.

## 0. Before you start

1. If there is no workspace, run `netherite init` first. It also adds the ruleset (a context item) that tells agents how to track work.
2. `search` for a project about this migration. If one exists, you are resuming: read its tasks and continue from the first one that is not `done`. Items already imported are skipped by `netherite import`, so a second run is safe.

## 1. Survey (read only)

Look for what is already written down. Skip `node_modules`, build output, vendored code, `CHANGELOG`, `LICENSE`, generated files and the Netherite content folder itself.

- **Docs:** `README*`, `docs/`, `doc/`, `wiki/`, guides, architecture notes, `CONTRIBUTING.md`.
- **Runbooks:** `runbooks/`, `playbooks/`, `ops/`, on-call and deploy notes, step-by-step operations.
- **Decision records:** `docs/adr/`, `adr/`, `doc/arch/`, `decisions/`, `rfcs/`, in any format (MADR, Nygard, a plain RFC).
- **Conventions for agents:** `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`.

For each file note the path, what type it is (`doc`, `runbook`, `adr`, `context`), a title, its size and how sure you are. Read enough to classify, not everything. Do not import anything that holds secrets (keys, tokens, passwords): flag it to the person instead. Show the person the list as a table with counts per type, and what you left out.

## 2. Ask, one question at a time

Put your recommendation first and say why. Do not pick for them.

1. **Copy or move the originals?** Recommend copy: nothing is lost, and the `source` field makes drift visible. Move removes the original (`--stub` leaves a one-line note). Never move `CLAUDE.md` or `AGENTS.md`.
2. **Keep the old ADR numbers?** Recommend keep (`0004-use-stow.md` becomes `ADR-00004`), and renumber only on a clash. Ask what to do about each clash.
3. **How big is a batch?** Suggest from the survey: everything in one batch up to about 15 candidates, else groups of 10 to 15 by folder, ADRs together.
4. **Which goal does this belong to?** `list` goals; recommend an existing one, or offer to create "Bring existing knowledge into Netherite".

## 3. Plan

Use the `netherite-plan` skill: one project, one task per batch, and in each task a checklist item per candidate that names its source path (`- [ ] docs/old/setup.md as doc`). Tag them `migration`. Link the project to the goal.

## 4. Each batch

1. Set the task `doing`. Write the batch as JSON to `.netherite/local/migration-<n>.json` (it is not committed). See `docs/reference/import.md` for the format; `netherite import --help` lists the flags.
2. **Entries.**
   - ADRs: `id` from the number in the file name, written with the workspace's padding (`ADR-00004`). Map the old status to `fields.status` (`accepted`, `proposed`, `deprecated`, `superseded`). Put the record's date in `fields.date`; if it has none, use the date the file was first committed (`git log --diff-filter=A --format=%as -1 -- <path>`). A record with no stated status is `proposed`: never invent `accepted`.
   - Docs and runbooks: guess `covers` from the paths the text mentions and that exist in the repository, as globs (`src/auth/**`). Check each one matches a file.
   - Conventions: `context`, with `include_in_context: true` and a `priority`. Check the budget with the `context` tool: a long file becomes a `doc`, plus a short context item that points at it (see `netherite-context`). Text between `<!-- netherite:` markers in `CLAUDE.md` or `AGENTS.md` was written by Netherite, and the import leaves it out by itself.
   - Anything you rewrote or summarised goes in `body`; otherwise the file's own text is used as it is. Do not improve the writing.
3. Show the entries to the person as a table (source, type, title, id, covers) and let them accept, change or reject each one.
4. Run `netherite import <file> --dry-run`, then without `--dry-run` for what was accepted, adding `--stub` only if they asked for it. Read the report: fix `failed` entries and run again, or tell the person why one cannot go in.
5. Tick the checklist items that were created or skipped, with `toggle_check`. A rejected candidate stays unticked, with a line in the task's Notes saying why. Set the task `done` when every item is ticked or rejected.

## 5. Link and check

After the ADRs are in, not before:

- For each old record that said "superseded by" another, `link` the newer ADR to it with `kind: supersedes`.
- `link` a doc to the ADR or item it explains (`kind: explains`) where its text names one.
- Run `lint` and fix what it reports. `source-missing` and `orphan` notes are information, not errors.
- Do not call `mark_reviewed`: nobody has reviewed these since they were imported.
- After importing `CLAUDE.md` or `AGENTS.md` as context, `context sync` will write the item back into that file between markers, so the file says it twice. Ask the person whether to delete the older text outside the markers once they have read the item. Do not do it unasked.

## 6. Finish

Tell the person: how many items were imported, skipped (already there) and need review (failed or rejected), what `lint` says, and that nothing is committed, so `git status` shows the changes. Then offer, and only offer, to look for decisions that were never written down with the `netherite-discover` skill. Do not start it unless they say yes.

## Do not

- Do not edit the item files by hand, or the originals unless the person chose `move`.
- Do not import secrets, and do not invent text, dates, statuses or reasons the source does not give.
- Do not mark an ADR `accepted` that the source did not say was accepted.
- Do not commit, push or merge.
