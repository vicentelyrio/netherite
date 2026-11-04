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
