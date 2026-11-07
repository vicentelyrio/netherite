import { connection } from '../connection'
import { skill } from '../skill'

export const contextSkill = skill(
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
)
