import { describe, expect, test } from 'vitest'
import { type History, type ItemHistory, lifecycles, withWorkingTree } from '../src/index'
import { world } from './ops-helpers'

const front = (type: string, id: string, extra: string) =>
  `---\nid: ${id}\naliases: [${id}]\ntype: ${type}\ntitle: ${id}\n${extra}---\n\n# ${id}\n`

const files = {
  '/repo/.netherite/config.yml': 'version: 1\n',
  '/repo/netherite/adr/ADR-00001-a.md': front(
    'adr',
    'ADR-00001',
    'status: accepted\ndate: 2026-02-01\n',
  ),
  '/repo/netherite/adr/ADR-00002-b.md': front(
    'adr',
    'ADR-00002',
    'status: proposed\ndate: 2026-02-01\n',
  ),
}

const author = { name: 'Ada', email: 'ada@example.com' }
const adr = (id: string, to: string): ItemHistory => ({
  id,
  type: 'adr',
  paths: [],
  transitions: [
    {
      id,
      type: 'adr',
      field: 'status',
      from: undefined,
      to,
      kind: 'created',
      hash: 'h1',
      date: '2026-02-01T10:00:00Z',
      author,
    },
  ],
  authors: [],
  created: { hash: 'h1', date: '2026-02-01T10:00:00Z', author },
  deletedAt: undefined,
  commits: 1,
})
// Committed: both proposed. In the files: ADR-00001 has since been accepted.
const history: History = {
  items: new Map([
    ['ADR-00001', adr('ADR-00001', 'proposed')],
    ['ADR-00002', adr('ADR-00002', 'proposed')],
  ]),
  commits: 1,
  log: [],
  partial: false,
}
const now = '2026-03-05T12:00:00Z'

describe('history with the working tree on top', () => {
  test('a change that is only in the file is added, dated now', async () => {
    const w = await world(files)
    const merged = withWorkingTree(history, w.repo.index, now)
    const added = merged.items.get('ADR-00001')?.transitions.at(-1)
    expect(added).toMatchObject({
      field: 'status',
      from: 'proposed',
      to: 'accepted',
      date: now,
      hash: 'working-tree',
    })
    // The lifecycle then knows it was accepted, today, though git does not.
    const life = lifecycles(merged, { states: w.repo.workspace.config.states, now })
    expect(life.get('ADR-00001')?.finished).toBe(now)
    expect(life.get('ADR-00002')?.finished).toBeUndefined()
  })

  test('an item that matches its history is left as it is, and so is the history', async () => {
    const w = await world(files)
    const merged = withWorkingTree(history, w.repo.index, now)
    expect(merged.items.get('ADR-00002')).toBe(history.items.get('ADR-00002'))
    const clean = withWorkingTree(
      { ...history, items: new Map([['ADR-00002', adr('ADR-00002', 'proposed')]]) },
      w.repo.index,
      now,
    )
    expect(clean.items.get('ADR-00002')?.transitions).toHaveLength(1)
  })
})
