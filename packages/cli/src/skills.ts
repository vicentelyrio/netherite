/**
 * The agent skills `netherite init` installs into `.claude/skills/` (ADR-00013), and the short
 * section for `AGENTS.md`. They are text bundled with the package, so a skill always matches the
 * version of the tools it calls. Skills name items by ID only.
 */

export interface Skill {
  /** Folder name under `.claude/skills/`. */
  readonly name: string
  /** The whole `SKILL.md`. */
  readonly text: string
}

const skill = (name: string, description: string, body: string): Skill => ({
  name,
  text: `---\nname: ${name}\ndescription: ${description}\n---\n\n${body.trim()}\n`,
})

const connection = `
These skills use the \`netherite\` MCP server (\`netherite mcp\`). If its tools are not available,
say so and stop; do not edit the item files by hand. Refer to items by ID (\`TASK-00042\`), never
by title or path. Every write is checked against the schema; if a call returns an error, read the
field messages, fix the input and call again.
`

export const skills: ReadonlyArray<Skill> = [
  skill(
    'netherite-adr',
    'Record an architecture or design decision as an ADR, link it to the work it affects, or supersede an earlier one. Use when a choice with lasting consequences is made or changed.',
    `
# Record a decision

${connection}

## Steps

1. \`search\` for an existing ADR on the topic. If one exists and still holds, link to it instead of writing a new one.
2. \`create\` with \`type: adr\`, a title that states the decision, \`fields.status\` (\`proposed\` until a person accepts it), \`fields.date\` and \`fields.deciders\` (@handles).
3. Put the text in \`body\` with three sections: **Context** (the forces, briefly), **Decision** (what was chosen, in the active voice), **Consequences** (what gets easier, what gets harder; start each bullet with \`\\+\` or \`\\-\`). If you can run commands, \`netherite templates adr\` prints this workspace's template; follow its sections.
4. \`link\` the new ADR to what it affects: the project (\`fields.project\`), and each task or project that follows from it.
5. \`lint\` the new item and fix what it reports.

## Changing a decision

An accepted ADR is not edited to say something different. Create a new ADR, then call \`link\` with \`kind: supersedes\` (from the new one to the old one), or \`set_state\` on the old one with \`state: superseded\` and \`superseded_by\`. Both files are updated together.

## Do not

- Do not mark an ADR \`accepted\` yourself; ask the person.
- Do not delete an ADR. Deprecate or supersede it.
`,
  ),
  skill(
    'netherite-plan',
    'Break a goal or request into a project and tasks with checklists, dependencies and linked decisions. Use when asked to plan, scope or split work.',
    `
# Plan work

${connection}

## Steps

1. \`search\` and \`list\` first. Reuse the goal and project that already exist; do not create duplicates.
2. If there is no goal, \`create\` one (\`type: goal\`) with a short title and the outcome in the body.
3. \`create\` a project (\`type: project\`) with \`fields.goals\`, and in the body its **Scope**, **Out of scope** and **Done when**.
4. \`create\` one task per piece of work that one person can finish and check. Each needs \`fields.project\` and a \`fields.state\` (\`backlog\` unless it is under way).
5. Put acceptance criteria in each task body under **Checklist** (\`- [ ] ...\`), one line per verifiable outcome, and leave a **Notes** section for what is learned. If you can run commands, \`netherite templates project\` and \`netherite templates task\` print this workspace's templates.
6. Use \`link\` with \`kind: depends_on\` for ordering, and link the ADRs that constrain a task.
7. If planning needed a choice that is not recorded, stop and use the \`netherite-adr\` skill.
8. \`lint\` the workspace and fix what it reports. Then summarise the plan by ID.

## Rules of thumb

- A task is done when its checklist is. If it cannot be checked, split or sharpen it.
- Prefer many small tasks to one large one; keep dependencies few.
`,
  ),
  skill(
    'netherite-task',
    'Pick up, update and complete tasks, ticking checklist items as the work lands. Use when working on a task or asked about what to do next.',
    `
# Work on a task

${connection}

## Picking up work

1. \`list\` tasks with \`state: backlog\` (or \`doing\`) for the project, or \`get\` the one you were given.
2. \`get\` the task and read its body, its \`depends_on\` tasks and the ADRs it links. If a dependency is not \`done\`, say so and pick another.
3. \`set_state\` to \`doing\`.

## While working

- \`toggle_check\` checklist items when that part is finished and verified, not before. Use an item's text or position, or give \`items\` to tick several in one call and \`all: true\` once everything is done: one write, all or nothing. The result lists the checklist as it is now.
- Record what you learned in the task body with \`update\` and a \`section\` (\`mode: append\` under \`## Notes\`).
- Use \`base_hash\` from \`get\` when you update, so a change made by someone else is not overwritten. If you get a conflict, \`get\` again and redo the edit.

## Finishing

1. Every checklist item is ticked, tests and lint pass.
2. \`set_state\` to \`done\`.
3. If the change makes a doc out of date, use the \`netherite-refresh\` skill.

Set \`blocked\` and say why in the body when you cannot go on.
`,
  ),
  skill(
    'netherite-refresh',
    'Review a stale or drifting doc, runbook or context item against the code that changed, update it and mark it reviewed. Use when lint reports freshness problems or code covered by a doc changed.',
    `
# Refresh a doc

${connection}

## Steps

1. \`lint\` to find items reported as \`drifting\` or \`stale\`, or take the ID you were given.
2. \`get\` the item. Its \`covers\` globs name the code it describes; its freshness says how many commits have touched that code since \`reviewed_at\`.
3. Read the covered code and what changed. Compare it with the doc, claim by claim.
4. Fix what is wrong with \`update\` and a \`section\`, changing only the parts that are out of date.
5. Call \`mark_reviewed\` only when you checked the whole doc against the code, not just the part you changed. If you could not, leave it unreviewed and say what remains.

## Do not

- Do not call \`mark_reviewed\` to silence a warning.
- Do not rewrite sections that are still correct.
`,
  ),
  skill(
    'netherite-context',
    'Create or update context items that are given to every agent, and keep them within the token budget. Use when asked to add repo conventions, rules or background for agents.',
    `
# Curate agent context

${connection}

## What belongs

Context items are short, durable facts an agent needs in every session: conventions, commands, boundaries, vocabulary. Anything long or specific to one task belongs in a doc, linked from a short context item.

## Steps

1. \`context\` shows what agents get now, and what did not fit the budget. Read it first.
2. \`search\` for an existing item on the topic; \`update\` it rather than adding a second.
3. To add: \`create\` with \`type: context\`, \`fields.include_in_context: true\`, a \`fields.priority\` (\`high\` for rules that must never be missed), and optionally \`fields.targets\` and \`fields.project\`. Write the body as terse instructions, under **Rules** and **Layout** (\`netherite templates context\` prints the template).
4. If items are left out by the budget, shorten or merge the low-value ones; do not raise the budget without asking.
5. \`mark_reviewed\` after checking an item is still true.
6. Tell the person to run \`netherite context sync\` so \`CLAUDE.md\` and \`AGENTS.md\` follow.
`,
  ),
  skill(
    'netherite-migrate',
    'Bring the docs, runbooks, decision records and agent conventions of an existing project into Netherite: survey the repository, ask the person at each choice, plan the work as a project with tasks, and import it in reviewed batches. Use when asked to migrate, import or adopt Netherite in a repository that already has documentation.',
    `
## Bring an existing project into Netherite

This skill needs two things beyond the \`netherite\` MCP tools: to read files in the repository, and to run \`netherite import\`. If you cannot run commands, say so, write the batch file, and give the person the command to run. Work in phases and stop at every question: the person decides, you recommend. Never commit.

## 0. Before you start

1. If there is no workspace, run \`netherite init\` first. It also adds the ruleset (a context item) that tells agents how to track work.
2. \`search\` for a project about this migration. If one exists, you are resuming: read its tasks and continue from the first one that is not \`done\`. Items already imported are skipped by \`netherite import\`, so a second run is safe.

## 1. Survey (read only)

Look for what is already written down. Skip \`node_modules\`, build output, vendored code, \`CHANGELOG\`, \`LICENSE\`, generated files and the Netherite content folder itself.

- **Docs:** \`README*\`, \`docs/\`, \`doc/\`, \`wiki/\`, guides, architecture notes, \`CONTRIBUTING.md\`.
- **Runbooks:** \`runbooks/\`, \`playbooks/\`, \`ops/\`, on-call and deploy notes, step-by-step operations.
- **Decision records:** \`docs/adr/\`, \`adr/\`, \`doc/arch/\`, \`decisions/\`, \`rfcs/\`, in any format (MADR, Nygard, a plain RFC).
- **Conventions for agents:** \`CLAUDE.md\`, \`AGENTS.md\`, \`.cursorrules\`, \`.cursor/rules/\` and \`.mdc\` rule files, \`.ai/\` or \`.claude/\` folders, \`.github/copilot-instructions.md\`. Follow symlinks once: \`.claude/context\` pointing at \`.ai/context\` is one folder, not two.

For each file note the path, what type it is (\`doc\`, \`runbook\`, \`adr\`, \`context\`), a title, its size and how sure you are. Read enough to classify, not everything. Never read \`.env*\` files. Do not import anything that holds secrets (keys, tokens, passwords): flag it to the person instead.

Some finds are not for import, and you say so in the table, with a count:
- **Per-folder \`AGENTS.md\` files** (a repository can have hundreds): agents read them in place, and as context they would fill the budget. Recommend leaving them where they are, and importing only the root and app-level ones.
- **Stubs** that only point at another file (a \`CLAUDE.md\` that says \`@AGENTS.md\`).
- **Folders managed by another tool** (\`openspec/\`, changesets, generated reference docs, an indexed wiki): ask, and recommend skip. The tool owns them and keeps rewriting them.
- **Blocks written by another tool** inside a file (\`<!-- BEGIN:... -->\`): the tool re-adds them, so leave them out of the text you import.

Show the person the list as a table with counts per type, and what you left out.

## 2. Ask, one question at a time

Put your recommendation first and say why. Do not pick for them.

1. **Copy or move the originals?** Recommend copy: nothing is lost, and the \`source\` field makes drift visible. Move removes the original (\`--stub\` leaves a one-line note). Never move \`CLAUDE.md\` or \`AGENTS.md\`.
2. **Keep the old ADR numbers?** Recommend keep (\`0004-use-stow.md\` becomes \`ADR-00004\`), and renumber only on a clash. Ask what to do about each clash.
3. **How big is a batch?** Suggest from the survey: everything in one batch up to about 15 candidates, else groups of 10 to 15 by folder, ADRs together.
4. **Which goal does this belong to?** \`list\` goals; recommend an existing one, or offer to create "Bring existing knowledge into Netherite".
5. **In a monorepo, which parts?** Recommend starting with one package and its decision records, then the shared docs, so the first batches are quick to review.

## 3. Plan

Use the \`netherite-plan\` skill: one project, one task per batch, and in each task a checklist item per candidate that names its source path (\`- [ ] docs/old/setup.md as doc\`). Tag them \`migration\`. Link the project to the goal.

## 4. Each batch

1. Set the task \`doing\`. Write the batch as JSON to \`.netherite/local/migration-<n>.json\` (it is not committed). See https://vicentelyrio.github.io/netherite/reference/import for the format; \`netherite import --help\` lists the flags. When many files share one format (dozens of decision records, say), write a small script that builds the batch from them instead of typing entries, show the person the table and three entries in full, and run it again for the next batch.
2. **Entries.**
   - ADRs: \`id\` from the number in the file name, written with the workspace's padding (\`ADR-00004\`). Read the status line the way the record means it, and map it to \`fields.status\` (\`accepted\`, \`proposed\`, \`deprecated\`, \`superseded\`): a record that is wholly "superseded by" another is \`superseded\`, \`retired\` is \`deprecated\`, and a record that is only amended or partly superseded stays \`accepted\`. Do not lose the nuance: keep the original status line in \`body\` as \`**Status as written:** ...\`, put a word such as \`provisional\` in \`fields.tags\`, and keep a "Revisit when" line. Put the record's date in \`fields.date\`; if it has none, use the date the file was first committed (\`git log --diff-filter=A --format=%as -1 -- <path>\`). A record with no stated status is \`proposed\`: never invent \`accepted\`. Leave out \`deciders\` unless the record names them: the person running the import did not decide it. When a record's status and date are lines at the top rather than headings, take them out of \`body\` once they are fields.
   - Docs and runbooks: \`covers\` is what the doc **describes**, not everything it mentions, and it decides when the doc shows as stale. Propose globs (\`src/auth/**\`) only for paths that exist and that the doc is about, and leave \`covers\` out when unsure: a wrong one means false alarms. Never cover absolute paths, \`.env*\` files, or the code the doc says it is moving away from. In one real monorepo, 59 of 90 docs mentioned an existing path and few were about it.
   - Conventions: \`context\`, with \`include_in_context: true\` and a \`priority\`. Check the budget with the \`context\` tool: a long file becomes a \`doc\`, plus a short context item that points at it (see \`netherite-context\`). For \`CLAUDE.md\` and \`AGENTS.md\`, give a \`body\` without any text between \`<!-- netherite:\` markers, since \`context sync\` writes those blocks.
   - Titles: the import takes the first heading (and drops an ADR's number), else the file name. Read the title column: a flow doc's \`3 · Fix\` or a file name that loses an acronym (\`pr conventions\` for \`PR conventions\`) needs a \`title\`.
   - The source's own frontmatter is dropped (a Cursor rule's \`description\` and \`globs\`, say). Carry over what is worth keeping, in \`body\` or \`fields\`.
   - Anything you rewrote or summarised goes in \`body\`; otherwise the file's own text is used as it is. Do not improve the writing.
3. Show the entries to the person as a table (source, type, title, id, covers) and let them accept, change or reject each one.
4. Run \`netherite import <file> --dry-run\`, then without \`--dry-run\` for what was accepted, adding \`--stub\` only if they asked for it. Read the report: fix \`failed\` entries and run again, or tell the person why one cannot go in.
5. Tick the checklist items that were created or skipped, with \`toggle_check\`. A rejected candidate stays unticked, with a line in the task's Notes saying why. Set the task \`done\` when every item is ticked or rejected.

## 5. Link and check

The import itself turns relative links between imported files (\`[the session](0025-session.md)\`) into links between items, in every batch, so earlier files point at later ones. What is left are links to files you did not import. After the ADRs are in, not before:

- For each old record that said "superseded by" another, \`link\` the newer ADR to it with \`kind: supersedes\`.
- \`link\` a doc to the ADR or item it explains (\`kind: explains\`) where its text names one and the text has no link yet.
- Run \`lint\` and fix what it reports. \`source-missing\` and \`orphan\` notes are information, not errors.
- Do not call \`mark_reviewed\`: nobody has reviewed these since they were imported.
- After importing \`CLAUDE.md\` or \`AGENTS.md\` as context, \`context sync\` will write the item back into that file between markers, so the file says it twice. Ask the person whether to delete the older text outside the markers once they have read the item. Do not do it unasked.

## 6. Finish

Tell the person: how many items were imported, skipped (already there) and need review (failed or rejected), what \`lint\` says, and that nothing is committed, so \`git status\` shows the changes. Then offer, and only offer, to look for decisions that were never written down with the \`netherite-discover\` skill. Do not start it unless they say yes.

## Do not

- Do not edit the item files by hand, or the originals unless the person chose \`move\`.
- Do not read \`.env*\` files, do not import secrets, and do not invent text, dates, statuses or reasons the source does not give.
- Do not mark an ADR \`accepted\` that the source did not say was accepted.
- Do not commit, push or merge.
`,
  ),
  skill(
    'netherite-discover',
    'Propose ADRs for decisions that were made but never written down, reconstructed from git history, pull request text and dependency changes, each marked as proposed and reconstructed with its evidence and confidence. Use only when the person has agreed to look for unrecorded decisions, usually after a migration.',
    `
# Propose the decisions nobody recorded

Some decisions in a repository were made and never written down. This skill reconstructs them from evidence and proposes them as ADRs, for the person to accept, correct or throw away. Run it only when the person has said yes: another skill may offer it, but never start it yourself. It needs \`git\` to read history. Never commit.

What it produces is a guess made from evidence, so it says so everywhere: every ADR is \`proposed\`, tagged \`reconstructed\`, links its evidence and states how sure it is. A reason that is not in the evidence is not written: you ask the person.

## 1. Ask first, one question at a time

Put your recommendation first and say why.

1. **How far back?** Recommend the last 12 months or the last 500 commits, whichever is less. Older history is rarely worth the reading.
2. **How many to propose?** Recommend at most 10: more than that is more than a person reviews well.
3. **Any area to focus on?** A folder, a service, a theme such as "build" or "auth". Optional.
4. **May I read pull request text?** Recommend yes if the \`gh\` command is installed and signed in. It is read only. Without it, use the commit messages.

## 2. Find the evidence

Read history and the current repository, and keep notes of the commit hashes (7 characters) that support each candidate.

- **Commits that explain a choice:** a subject or body with "switch to", "replace", "migrate", "drop", "adopt", "instead of", "because", "so that", "decided".
- **Dependency and tooling changes:** what a manifest or lockfile gained or lost (\`package.json\`, \`Cargo.toml\`, \`pyproject.toml\`, \`go.mod\`, a CI file, a formatter or linter config), read with \`git log -p -- <file>\`.
- **Large refactors:** commits that touch many files in a folder with a message that says what moved and why.
- **Replaced or deleted modules:** \`git log --diff-filter=D --name-only\`, and what took their place.
- **Pull request text and linked issues,** if the person allowed it, and comments in the code that say why.

A candidate is a decision with a **before and after**: two things were possible and one was chosen. A routine change, a bug fix or a version bump is not a decision. Skip it.

\`search\` the existing ADRs first. If one already records the choice, say so and \`link\` to it instead of proposing another.

## 3. Show the list, and let the person choose

A table: a title that states the decision, the date of the commit that made it, its evidence (hashes), your confidence, and what is missing. Say how many you found and how many you are proposing. Let the person accept, change or drop each one.

**Confidence**, and say which in the ADR:

- **high:** a commit or pull request says both what changed and why.
- **medium:** it says what changed, and a reason is stated somewhere close (an issue, a comment, a README line) but not in the commit.
- **low:** only the change is visible. The reason is not recorded.

For every **low** one, and for any reason you cannot find, ask the person why. If they answer, write it as theirs: "Reason, as told by the person on 2026-03-05: ...". If they do not know, leave "The reason was not recorded." and keep it \`low\`.

## 4. Plan and track

Use the \`netherite-plan\` skill, as \`netherite-migrate\` does: reuse the migration project if there is one, else create one ("Reconstruct unrecorded decisions") linked to a goal the person picks. Make one task per group of candidates, and in each a checklist item per candidate that names the evidence (\`- [ ] switch from Jest to Vitest (a1b2c3d)\`). Set the task \`doing\` while you work, and tick an item when its ADR is written and the person has seen it.

## 5. Write each ADR

\`create\` with \`type: adr\`, and:

- \`fields.status\`: \`proposed\`. Never \`accepted\`.
- \`fields.date\`: the date of the commit that made the decision, not today.
- \`fields.tags\`: \`["reconstructed"]\`.
- No \`deciders\`, unless the person names them. Do not infer a person from a commit author.
- A title that states the decision ("Use Vitest instead of Jest").
- A body with these sections, and nothing the evidence does not say:

\`\`\`
## Context
_Reconstructed from history; it was not recorded when it was made._ What the evidence says about the situation before the change.

## Decision
What was chosen, as the evidence shows it.

## Consequences
- \\+ A consequence that you can see in the repository now.
- \\- Another, or "Not recorded." if you can see none.

## Evidence
- \`a1b2c3d\` 2025-03-02 the commit subject (pull request 41)
- Confidence: medium. A reason is stated in the pull request but not in the commit.
- Not known: who weighed the alternatives, and what else was considered.
\`\`\`

\`link\` the ADR to the project it affects. Then \`lint\` and fix what it reports.

## 6. Finish

Tell the person how many ADRs you proposed, at which confidence, which questions are still open, and that every one is \`proposed\`: they accept an ADR in the app or by telling you to, and you never do it for them. Nothing is committed.

## Do not

- Do not write a reason, an alternative that was rejected, or a consequence that the evidence does not show. "Probably because" is a guess: ask instead.
- Do not mark an ADR \`accepted\`, and do not write today's date as the decision date.
- Do not name people as deciders from commit authorship.
- Do not propose a bug fix, a version bump or a rename as a decision.
- Do not start without a yes, and do not commit, push or merge.
`,
  ),
]

/** The text between the markers in `AGENTS.md`. */
export const agentsSection = `
## How this repo tracks work

Goals, projects, tasks, decisions (ADRs), docs and runbooks are Markdown files with YAML frontmatter, in the content folder named in \`.netherite/config.yml\`. Each has an ID such as \`TASK-00042\`; link to items with \`[[TASK-00042]]\`.

- Use the \`netherite\` MCP server (\`netherite mcp\`) to search, create and update items. Do not rename files or edit frontmatter IDs by hand.
- Find work with \`list\` and \`search\`; read an item with \`get\`; change a task with \`set_state\` and \`toggle_check\`.
- Record lasting decisions as ADRs. Never rewrite an accepted ADR; supersede it.
- Run \`netherite lint\` before finishing. Nothing is committed for you.
- Skills for common jobs are in \`.claude/skills/netherite-*\`.
`
