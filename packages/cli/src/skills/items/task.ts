import { connection } from '../connection'
import { skill } from '../skill'

export const taskSkill = skill(
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
)
