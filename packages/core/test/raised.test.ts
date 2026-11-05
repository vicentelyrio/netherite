import { describe, expect, test } from 'vitest'
import { enabledRules, type Freshness, raised } from '../src/index'
import { world } from './ops-helpers'

const item = (type: string, id: string, extra: string) =>
  `---\nid: ${id}\naliases: [${id}]\ntype: ${type}\ntitle: ${id}\n${extra}---\n\n# ${id}\n`

const config = 'version: 1\n'
const files = (cfg = config) => ({
  '/repo/.netherite/config.yml': cfg,
  '/repo/netherite/tasks/TASK-00001-a.md': item(
    'task',
    'TASK-00001',
    'state: doing\ndue: 2026-02-01\nlabels: [backend]\n',
  ),
  '/repo/netherite/tasks/TASK-00002-b.md': item(
    'task',
    'TASK-00002',
    'state: done\ndue: 2026-02-01\nlabels: [Back-End]\n',
  ),
  '/repo/netherite/adrs/ADR-00001-x.md': item('adr', 'ADR-00001', 'status: proposed\n'),
  '/repo/netherite/docs/DOC-00001-d.md': item('doc', 'DOC-00001', 'tags: [guide]\n'),
})

const stale: Freshness = {
  state: 'stale',
  commits: 12,
  uncommitted: false,
  baseline: { source: 'last-commit', date: '2026-01-05T00:00:00Z', hash: 'a'.repeat(40) },
  atLeast: false,
  covers: ['src/**'],
}
const now = '2026-02-15T12:00:00Z'

describe('raised', () => {
  test('each rule raises what it should, with a key that stays', async () => {
    const w = await world(files())
    const doc = w.repo.index.findById('DOC-00001')[0]?.path as string
    const out = raised(w.repo, {
      now,
      freshness: new Map([[doc, stale]]),
      commits: [
        { hash: 'b'.repeat(40), date: '2026-02-10T00:00:00Z', subject: 'fix: closes TASK-00001' },
        { hash: 'c'.repeat(40), date: '2026-02-11T00:00:00Z', subject: 'fix TASK-00002 typo' },
      ],
      todos: [
        {
          hash: 'd'.repeat(40),
          date: '2026-02-12T00:00:00Z',
          path: 'src/a.ts',
          line: 7,
          text: '// TODO: x',
        },
      ],
    })
    const keys = out.map((r) => r.key)
    expect(keys).toContain('stale-doc:DOC-00001')
    expect(keys).toContain('proposed-adr:ADR-00001')
    expect(keys).toContain('overdue-task:TASK-00001:2026-02-01')
    expect(keys).toContain(`closing-commit:TASK-00001:${'b'.repeat(12)}`)
    expect(keys).toContain(`new-todo:${'d'.repeat(12)}:src/a.ts:7`)
    expect(keys.some((k) => k.startsWith('similar-tag:'))).toBe(true)
    expect(keys.some((k) => k.includes('TASK-00002'))).toBe(false)
    expect(raised(w.repo, { now }).map((r) => r.key)).toEqual(
      raised(w.repo, { now }).map((r) => r.key),
    )
  })

  test('a task due today or later is not overdue', async () => {
    const w = await world(files())
    const early = raised(w.repo, { now: '2026-02-01T08:00:00Z' })
    expect(early.some((r) => r.rule === 'overdue-task')).toBe(false)
  })

  test('newest first', async () => {
    const w = await world(files())
    const out = raised(w.repo, {
      now,
      todos: [
        { hash: 'd'.repeat(40), date: '2026-02-12T00:00:00Z', path: 'a.ts', line: 1, text: 'TODO' },
      ],
    })
    expect(out[0]?.rule).toBe('new-todo')
  })

  test('a rule is off when the config says so', async () => {
    const w = await world(
      files('version: 1\ninbox:\n  rules:\n    proposed-adr: false\n    orphan: false\n'),
    )
    expect(enabledRules(w.repo).has('proposed-adr')).toBe(false)
    expect(enabledRules(w.repo).has('overdue-task')).toBe(true)
    const rules = new Set(raised(w.repo, { now }).map((r) => r.rule))
    expect(rules.has('proposed-adr')).toBe(false)
    expect(rules.has('orphan')).toBe(false)
  })
})
