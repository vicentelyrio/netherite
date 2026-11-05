# Migrate an existing repository

A repository that has been going for a while already has knowledge in it: a README, a `docs/`
folder, decision records in some format, a `CLAUDE.md`, and decisions that were made and never
written down. Starting Netherite empty means writing all of that again. The `netherite-migrate`
skill brings it in, and `netherite-discover` can then look for the decisions nobody recorded.

An agent does the reading and the classifying. You make every choice, and nothing is committed:
you review the result in `git diff`.

## Which part does what

| Part | What it is | What it does |
| --- | --- | --- |
| `netherite scan` | a command | looks through the repository by path and file name and drafts the batch; it only reads |
| `netherite import` | a command | writes the items from a batch file, such as the draft; it never commits |
| `netherite-migrate` | a skill, for an agent | runs `scan`, reads what it found, asks you at each choice, and imports in batches |
| `netherite-discover` | a skill, for an agent | optional, after the migration: proposes decision records for choices nobody wrote down, from git history |

`scan` classifies by where a file is and what it is called, so it can be wrong about a type, and it
does not read for meaning. The agent checks its work, you decide, and `import` does the writing.

## Start it

You need an agent that can read files and run commands, such as Claude Code, and the skills
installed in the repository (`netherite init` does it; `netherite init --update` brings them up to
date). Then ask in plain words:

> Migrate this repository's docs and decision records into Netherite.

If Netherite is not set up yet, the skill runs `netherite init` first. Without an agent you can do
the last step by hand: write a batch file and run [`netherite import`](reference/import.md).

## The flow

1. **Survey, read only.** The agent runs `netherite scan`, which looks for docs, runbooks, decision
   records (MADR, Nygard, plain RFCs) and agent conventions (`CLAUDE.md`, `AGENTS.md`,
   `.cursorrules`). It skips vendored and generated files and anything that looks like it holds a
   secret. The agent reads it, corrects it, and shows you a table of what it found, with a type for
   each and what it left out.
2. **Questions**, one at a time, each with a recommendation:

   | Question | Recommended | Why |
   | --- | --- | --- |
   | Copy or move the originals? | copy | nothing is lost, and the `source` field shows if they drift apart |
   | Keep the old ADR numbers? | keep, renumber only on a clash | links in old code and chat still work |
   | How big is a batch? | everything up to about 15 files, else groups of 10 to 15 | a batch is what you review in one sitting |
   | Which goal does this belong to? | an existing one | the work shows on your boards |

3. **A plan.** The migration is a project with one task per batch and a checklist item per file,
   named by its source path. It shows on the board and in the Inbox like any other work, and any
   agent can pick it up where another stopped.
4. **Each batch.** The agent writes the batch file, shows you the entries (source, type, title, ID,
   what the doc covers) and lets you accept, change or reject each. It runs
   `netherite import --dry-run`, then the real import, and ticks what went in. A rejected file stays
   unticked, with a note.
5. **Linking.** Once the ADRs are in, the agent links "superseded by" pairs, links docs to the
   decisions they explain, and runs `netherite lint`.
6. **The end.** You get a count of what was imported, skipped and needs review, and an offer to run
   `netherite-discover`. It only runs if you say yes.

## What real repositories look like

The flow was tried on a monorepo with 79 decision records (with status lines such as
`accepted (provisional)` and `accepted; read path amended by 0070`), about 90 docs, an `AGENTS.md`
in nearly every folder and an `openspec/` folder of over a thousand files. That is why the survey:

- **leaves out** per-folder `AGENTS.md` files (agents read them in place, and as context they would
  fill the budget), stubs that only say `@AGENTS.md`, and folders another tool owns (`openspec/`),
  and tells you how many it skipped;
- **reads statuses the way the record means them**: a record wholly superseded is `superseded`, one
  that is only amended stays `accepted`, and the original status line is kept in the text;
- **turns the links between imported files into links between items**, 749 of them in 140 files,
  so the graph and backlinks work from the first run;
- **leaves `covers` out when unsure**, because a wrong one means false "stale" alarms.

## What you should review

- **ADR statuses and dates.** They come from the old records. An old record with no stated status
  is imported as `proposed`; the skill never makes one `accepted` on its own.
- **`covers` on docs and runbooks.** They are guessed from the paths the text mentions, and checked
  to exist. They decide when a doc shows as stale, so a wrong one means false alarms or none.
- **Convention files.** `CLAUDE.md` becomes a context item, within the token budget; a long one
  becomes a doc with a short context item pointing at it. After the first `context sync`, the item
  is written back into `CLAUDE.md`, so the file says it twice: delete the older text outside the
  markers when you have read the item. The agent asks; it does not do it unasked.
- **What it skipped.** Anything that looked like a secret is listed for you, not imported.

Imported items keep where they came from: `source` is the path or URL and `imported_at` is the day.
`netherite lint` reports `source-missing` (info) if the original is later moved or deleted.

## Decisions nobody wrote down

`netherite-discover` reads git history, dependency changes and pull request text, and proposes ADRs.
It asks how far back to look and how many to propose. Every ADR is `proposed`, tagged
`reconstructed`, lists the commits it rests on and says how sure it is: **high** when a commit or
pull request states what and why, **medium** when the reason is stated nearby, **low** when only the
change is visible. It never writes a reason the evidence does not give: it asks you, and if you
answer it records the answer as yours.

## Run it again

Everything is safe to repeat. `netherite import` finds an item by its `source` and skips it, or
refreshes it with `--update`. A migration that stopped halfway is resumed from the first task that
is not done.
