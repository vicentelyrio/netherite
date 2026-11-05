import { describe, expect, test } from 'vitest'
import { knowledgeRows, setState } from '../src/index'
import { cleanFiles, world } from './ops-helpers'

const front = (lines: string[]) => `---\n${lines.join('\n')}\n---\n`

const files = () => ({
  ...cleanFiles(),
  '/repo/netherite/docs/DOC-00002-guide.md': `${front([
    'id: DOC-00002',
    'aliases: [DOC-00002]',
    'type: doc',
    'title: Guide',
    'owner: "@ada"',
    'explains: [TASK-00001, TASK-00002, PRJ-00001]',
  ])}\n# Guide\n\nText.\n`,
  '/repo/netherite/context/CTX-00003-rules.md': `${front([
    'id: CTX-00003',
    'aliases: [CTX-00003]',
    'type: context',
    'title: Rules',
    'include_in_context: true',
  ])}\n# Rules\n\nAlways test the change before saying it works.\n`,
})

describe('what the knowledge index adds for each row', () => {
  test('the owner, what it explains by type, and the tokens it adds to agent context', async () => {
    const w = await world(files())
    const rows = knowledgeRows(w.repo, undefined)
    const guide = rows.find((r) => r.id === 'DOC-00002')
    expect(guide?.handle).toBe('@ada')
    // The project it belongs to is not counted among what it explains.
    expect(guide?.explains).toEqual({ task: 2 })
    expect(guide?.aiTokens).toBeNull()
    const rules = rows.find((r) => r.id === 'CTX-00003')
    expect(rules?.aiTokens).toBeGreaterThan(0)
  })

  test('a retired context item adds no tokens', async () => {
    const w = await world(files())
    await w.run(setState(w.repo, 'CTX-00003', 'deprecated'))
    expect(knowledgeRows(w.repo, undefined).find((r) => r.id === 'CTX-00003')?.aiTokens).toBeNull()
  })
})
