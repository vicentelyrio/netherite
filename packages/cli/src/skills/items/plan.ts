import { connection } from '../connection'
import { skill } from '../skill'

export const planSkill = skill(
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
)
