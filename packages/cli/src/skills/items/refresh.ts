import { connection } from '../connection'
import { skill } from '../skill'

export const refreshSkill = skill(
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
)
