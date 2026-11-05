---
name: netherite-migrate
description: Bring the docs, runbooks, decision records and agent conventions of an existing project into Netherite: survey the repository, ask the person at each choice, plan the work as a project with tasks, and import it in reviewed batches. Use when asked to migrate, import or adopt Netherite in a repository that already has documentation.
---

## Bring an existing project into Netherite

This skill needs two things beyond the `netherite` MCP tools: to read files in the repository, and to run `netherite import`. If you cannot run commands, say so, write the batch file, and give the person the command to run. Work in phases and stop at every question: the person decides, you recommend. Never commit.

## 0. Before you start

1. If there is no workspace, run `netherite init` first. It also adds the ruleset (a context item) that tells agents how to track work.
2. `search` for a project about this migration. If one exists, you are resuming: read its tasks and continue from the first one that is not `done`. Items already imported are skipped by `netherite import`, so a second run is safe.

## 1. Survey (read only)

Look for what is already written down. Skip `node_modules`, build output, vendored code, `CHANGELOG`, `LICENSE`, generated files and the Netherite content folder itself.

- **Docs:** `README*`, `docs/`, `doc/`, `wiki/`, guides, architecture notes, `CONTRIBUTING.md`.
- **Runbooks:** `runbooks/`, `playbooks/`, `ops/`, on-call and deploy notes, step-by-step operations.
- **Decision records:** `docs/adr/`, `adr/`, `doc/arch/`, `decisions/`, `rfcs/`, in any format (MADR, Nygard, a plain RFC).
- **Conventions for agents:** `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.cursor/rules/` and `.mdc` rule files, `.ai/` or `.claude/` folders, `.github/copilot-instructions.md`. Follow symlinks once: `.claude/context` pointing at `.ai/context` is one folder, not two.

For each file note the path, what type it is (`doc`, `runbook`, `adr`, `context`), a title, its size and how sure you are. Read enough to classify, not everything. Never read `.env*` files. Do not import anything that holds secrets (keys, tokens, passwords): flag it to the person instead.

Some finds are not for import, and you say so in the table, with a count:
- **Per-folder `AGENTS.md` files** (a repository can have hundreds): agents read them in place, and as context they would fill the budget. Recommend leaving them where they are, and importing only the root and app-level ones.
- **Stubs** that only point at another file (a `CLAUDE.md` that says `@AGENTS.md`).
- **Folders managed by another tool** (`openspec/`, changesets, generated reference docs, an indexed wiki): ask, and recommend skip. The tool owns them and keeps rewriting them.
- **Blocks written by another tool** inside a file (`<!-- BEGIN:... -->`): the tool re-adds them, so leave them out of the text you import.

Show the person the list as a table with counts per type, and what you left out.

## 2. Ask, one question at a time

Put your recommendation first and say why. Do not pick for them.

1. **Copy or move the originals?** Recommend copy: nothing is lost, and the `source` field makes drift visible. Move removes the original (`--stub` leaves a one-line note). Never move `CLAUDE.md` or `AGENTS.md`.
2. **Keep the old ADR numbers?** Recommend keep (`0004-use-stow.md` becomes `ADR-00004`), and renumber only on a clash. Ask what to do about each clash.
3. **How big is a batch?** Suggest from the survey: everything in one batch up to about 15 candidates, else groups of 10 to 15 by folder, ADRs together.
4. **Which goal does this belong to?** `list` goals; recommend an existing one, or offer to create "Bring existing knowledge into Netherite".
5. **In a monorepo, which parts?** Recommend starting with one package and its decision records, then the shared docs, so the first batches are quick to review.

## 3. Plan

Use the `netherite-plan` skill: one project, one task per batch, and in each task a checklist item per candidate that names its source path (`- [ ] docs/old/setup.md as doc`). Tag them `migration`. Link the project to the goal.

## 4. Each batch

1. Set the task `doing`. Write the batch as JSON to `.netherite/local/migration-<n>.json` (it is not committed). See https://vicentelyrio.github.io/netherite/reference/import for the format; `netherite import --help` lists the flags. When many files share one format (dozens of decision records, say), write a small script that builds the batch from them instead of typing entries, show the person the table and three entries in full, and run it again for the next batch.
2. **Entries.**
   - ADRs: `id` from the number in the file name, written with the workspace's padding (`ADR-00004`). Read the status line the way the record means it, and map it to `fields.status` (`accepted`, `proposed`, `deprecated`, `superseded`): a record that is wholly "superseded by" another is `superseded`, `retired` is `deprecated`, and a record that is only amended or partly superseded stays `accepted`. Do not lose the nuance: keep the original status line in `body` as `**Status as written:** ...`, put a word such as `provisional` in `fields.tags`, and keep a "Revisit when" line. Put the record's date in `fields.date`; if it has none, use the date the file was first committed (`git log --diff-filter=A --format=%as -1 -- <path>`). A record with no stated status is `proposed`: never invent `accepted`. Leave out `deciders` unless the record names them: the person running the import did not decide it. When a record's status and date are lines at the top rather than headings, take them out of `body` once they are fields.
   - Docs and runbooks: `covers` is what the doc **describes**, not everything it mentions, and it decides when the doc shows as stale. Propose globs (`src/auth/**`) only for paths that exist and that the doc is about, and leave `covers` out when unsure: a wrong one means false alarms. Never cover absolute paths, `.env*` files, or the code the doc says it is moving away from. In one real monorepo, 59 of 90 docs mentioned an existing path and few were about it.
   - Conventions: `context`, with `include_in_context: true` and a `priority`. Check the budget with the `context` tool: a long file becomes a `doc`, plus a short context item that points at it (see `netherite-context`). For `CLAUDE.md` and `AGENTS.md`, give a `body` without any text between `<!-- netherite:` markers, since `context sync` writes those blocks.
   - Titles: the import takes the first heading (and drops an ADR's number), else the file name. Read the title column: a flow doc's `3 · Fix` or a file name that loses an acronym (`pr conventions` for `PR conventions`) needs a `title`.
   - The source's own frontmatter is dropped (a Cursor rule's `description` and `globs`, say). Carry over what is worth keeping, in `body` or `fields`.
   - Anything you rewrote or summarised goes in `body`; otherwise the file's own text is used as it is. Do not improve the writing.
3. Show the entries to the person as a table (source, type, title, id, covers) and let them accept, change or reject each one.
4. Run `netherite import <file> --dry-run`, then without `--dry-run` for what was accepted, adding `--stub` only if they asked for it. Read the report: fix `failed` entries and run again, or tell the person why one cannot go in.
5. Tick the checklist items that were created or skipped, with `toggle_check`. A rejected candidate stays unticked, with a line in the task's Notes saying why. Set the task `done` when every item is ticked or rejected.

## 5. Link and check

The import itself turns relative links between imported files (`[the session](0025-session.md)`) into links between items, in every batch, so earlier files point at later ones. What is left are links to files you did not import. After the ADRs are in, not before:

- For each old record that said "superseded by" another, `link` the newer ADR to it with `kind: supersedes`.
- `link` a doc to the ADR or item it explains (`kind: explains`) where its text names one and the text has no link yet.
- Run `lint` and fix what it reports. `source-missing` and `orphan` notes are information, not errors.
- Do not call `mark_reviewed`: nobody has reviewed these since they were imported.
- After importing `CLAUDE.md` or `AGENTS.md` as context, `context sync` will write the item back into that file between markers, so the file says it twice. Ask the person whether to delete the older text outside the markers once they have read the item. Do not do it unasked.

## 6. Finish

Tell the person: how many items were imported, skipped (already there) and need review (failed or rejected), what `lint` says, and that nothing is committed, so `git status` shows the changes. Then offer, and only offer, to look for decisions that were never written down with the `netherite-discover` skill. Do not start it unless they say yes.

## Do not

- Do not edit the item files by hand, or the originals unless the person chose `move`.
- Do not read `.env*` files, do not import secrets, and do not invent text, dates, statuses or reasons the source does not give.
- Do not mark an ADR `accepted` that the source did not say was accepted.
- Do not commit, push or merge.
