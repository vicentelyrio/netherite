---
id: TASK-00093
aliases: [TASK-00093]
type: task
title: Try the migration on a real repository and write it up
created: 2026-11-04T11:41:12Z
created_by: "@vicentelyrio"
project: PRJ-00004
state: done
decisions: [ADR-00026]
depends_on: [TASK-00089, TASK-00090, TASK-00091]
---

# Try the migration on a real repository and write it up

Run the whole flow once, so the skills and the command are shaped by use and not only by tests ([[ADR-00026]]).

- [x] An end-to-end test on a fixture repository with a README, a `docs/` folder, MADR-style ADRs and a `CLAUDE.md`
- [x] Run `netherite-migrate` on a real repository of yours and note what the survey missed or got wrong (done on a copy of its Markdown in a scratch folder, so the repository itself was not written to; see Notes)
- [x] Write a doc, "Migrate an existing repository", with the flow, the questions the skill asks and what to review
- [x] Adjust the skills from what the real run showed

## Notes

Run on a work monorepo (private, so it is described here and not named): one package with 79 ADRs,
9 context docs and an `AGENTS.md`, the root `docs/` (81 files) and a folder of agent rules, copied
into a scratch folder and imported there. The repository itself was only read. 188 entries went in
with none failing.

What the survey would have missed or got wrong, and what changed:

- **Links.** 785 relative Markdown links across 146 items pointed at files that were not in the
  workspace, so the graph had no edges and 185 items were orphans. The import now rewrites relative
  links between imported files as links between items, at the end of every run: 749 references in
  140 items, orphans down to 36. A link whose label is a code span was missed on the first try.
- **Deciders.** Every imported ADR was given the importer as its decider. The import now leaves
  `deciders` out.
- **Titles.** An ADR heading `0062 — Title` kept its number. The import drops it for ADRs; a doc such
  as `3 · Fix` is for the person to rename, and the skill says to read the title column.
- **Status lines.** There were about 20 spellings: `accepted (provisional)`, `retired (date)`, `accepted;
  X amended by 0067`, `superseded by ... (tab position ...)`, partial supersession. The skill now
  says how to map them and to keep the original line in the text.
- **Survey blind spots.** `.mdc` rule files, 213 per-folder `AGENTS.md` files, a `CLAUDE.md` that is
  only `@AGENTS.md`, a block another tool rewrites (`<!-- BEGIN:nextjs-agent-rules -->`), symlinked
  folders counted twice, an `openspec/` folder of 1,380 files, and a `.env` that must not be read.
- **`covers`.** 59 of 90 docs mentioned an existing path, but a guess by pattern picked up `/home`,
  `.env.preview` and the app being migrated from. The skill now says covers is what a doc describes.
- **My own slip.** The batch generator globbed the Netherite folder it had just made; the two
  failures were reported cleanly and the rest went in.
