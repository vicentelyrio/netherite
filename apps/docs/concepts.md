# Concepts

## Items

An item is one Markdown file: YAML frontmatter, then a title heading and text. There are seven
types, each in its own folder under the content root.

| Type | ID | Folder | What it is |
| --- | --- | --- | --- |
| goal | `GOAL-00001` | `goals/` | something you want to reach; may belong to an `area` |
| project | `PRJ-00001` | `projects/` | work towards one or more goals |
| task | `TASK-00001` | `tasks/` | a unit of work in a project, with a checklist and a state |
| adr | `ADR-00001` | `adr/` | a decision: proposed, accepted, deprecated or superseded |
| doc | `DOC-00001` | `docs/` | a guide that can list the code it `covers` |
| context | `CTX-00001` | `context/` | text for agents, synced into `CLAUDE.md` and `AGENTS.md` |
| runbook | `RUN-00001` | `runbooks/` | steps for an operation, may `cover` code |

The hierarchy is **area → goal → project → task**. The app shows it as columns of goals per area, a
page per goal listing its projects, and a board per project.

## IDs

An ID is a prefix and a number, padded to `id_padding` digits (5 by default). A new item gets the
next number after the highest one in use, and IDs are what links point at. A file name is
`<ID>-<slug>.md`: the slug follows the title, but the ID is what counts, so changing a title does
not break links. (Because the next number is the highest plus one, deleting the newest item frees
its number; `netherite lint` reports it if a deleted item's ID is still linked.) `aliases` in the frontmatter repeats the ID so other tools
can resolve `[[TASK-00042]]` (see [Obsidian](obsidian.md)).

## Links

Two kinds, and both end up in the graph:

- **Relations in frontmatter**, which carry meaning: `project`, `goals`, `decisions`,
  `depends_on`, `related`, `supersedes`, `superseded_by`, `explains`.
- **Wikilinks in text**: `[[ID]]`, `[[ID|label]]`, `[[ID#Heading]]`. Links in code spans and code
  blocks are not links.

| Field | On | Means |
| --- | --- | --- |
| `project` | task, ADR | belongs to that project |
| `goals` | project | belongs to those goals |
| `decisions` | task, project | implements those ADRs |
| `depends_on` | task | cannot finish before these tasks; shown as "Waiting on" |
| `related` | task | see also |
| `supersedes` / `superseded_by` | ADR | the chain of replaced decisions |
| `explains` | doc, runbook | describes these items |

Backlinks are computed, not stored: an item never needs editing because something links to it. An
item that no other item links to is an *orphan*. Knowledge can filter to them, and the Inbox lists
the orphaned decisions; a doc or runbook is raised there only when it goes stale.

## States

A task's `state` is one of the names in your `states` config; each name has a category (`todo`,
`active`, `blocked`, `done`) that decides its colour, whether a task counts as done in progress
bars, and whether it shows in the Inbox as blocked. An ADR has a `status` instead. Progress for a
project is tasks in a `done` state over all its tasks; for a goal, the same across its projects.

## Dates and horizons

Start dates are never written: when work began comes from the git history (when a task first left
the backlog, when a project got its first task). What you can write is where it should end. A goal
or project takes `due: YYYY-MM-DD`; a project can also name a `milestone` that the date stands
for. A goal takes a `horizon`, how far ahead it looks: `forever`, or a length such as `10 years`,
`6 months`, `90d`. Lint warns about a `due` before the item existed, a `milestone` without a `due`,
and a `horizon` it cannot read.

## Freshness

A doc or runbook (or context item) with `covers` globs is **fresh**, **drifting** or **stale**,
depending on how many commits since it was last reviewed touched the files it covers (thresholds in
`freshness`). "Reviewed" is `reviewed_at`, or the doc's own last commit if there is none. Items
without `covers` are not tracked, and neither are superseded or deprecated ADRs. Freshness needs
git history; in a shallow clone the counts are minimums.

## Context

Context items with `include_in_context: true` are rendered, highest `priority` first, into the files
named in `context.targets`, until the token budget is used; what does not fit is reported by
`netherite context sync`. They are also served to agents as the `netherite://context` resource.

## Who writes the files

Every write, from the app, the CLI or an agent, goes through the same core operations: the new text
is validated against the item schema, formatting and comments in the frontmatter are kept, and only
the lines that must change are touched. If the file changed since it was read, the write is refused
rather than overwriting someone's edit. Nothing is ever committed for you.
