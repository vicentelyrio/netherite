import { describe, expect, test } from 'vitest'
import { applyConfigEdits } from '../src/config-edit'
import { planConfigEdits } from '../src/index'

const handWritten = `# Our workspace
version: 1
content:   notes   # odd spacing stays

states:
  # the columns
  - { name: todo, category: todo }
  - {name: done, category: done}

freshness:
  drifting: 2   # be strict
  # stale is generous here
  stale: 20
context: { budget: 500, targets: [claude] }
custom_key:
    nested:   [ 1,2 ]
# the end
`

const edit = (text: string, set: unknown) => {
  const { edits, issues } = planConfigEdits(set)
  expect(issues).toEqual([])
  return applyConfigEdits(text, edits)
}

const changedLines = (before: string, after: string) => {
  const was = before.split('\n')
  const now = after.split('\n')
  return {
    removed: was.filter((line) => !now.includes(line)),
    added: now.filter((line) => !was.includes(line)),
  }
}

describe('editing the config text', () => {
  test('a scalar change touches one value and keeps its comment', () => {
    const next = edit(handWritten, { freshness: { drifting: 3 } })
    expect(changedLines(handWritten, next)).toEqual({
      removed: ['  drifting: 2   # be strict'],
      added: ['  drifting: 3   # be strict'],
    })
  })

  test('a nested key that is missing goes inside its own block', () => {
    const text = 'version: 1\nfreshness:\n  stale: 5 # keep\n# after\n'
    expect(edit(text, { freshness: { drifting: 2 } })).toBe(
      'version: 1\nfreshness:\n  stale: 5 # keep\n  drifting: 2\n# after\n',
    )
  })

  test('a flow map stays on one line and its other values stay', () => {
    const next = edit(handWritten, { context: { budget: 900 } })
    expect(changedLines(handWritten, next)).toEqual({
      removed: ['context: { budget: 500, targets: [claude] }'],
      added: ['context: { budget: 900, targets: [claude] }'],
    })
  })

  test('a list replaces only its own lines, and flow items stay flow', () => {
    const next = edit(handWritten, {
      states: [
        { name: 'todo', category: 'todo' },
        { name: 'review', category: 'active' },
        { name: 'done', category: 'done' },
      ],
    })
    expect(next).toContain(
      'states:\n  - { name: todo, category: todo }\n  - { name: review, category: active }\n  - { name: done, category: done }\n\nfreshness:',
    )
    expect(next).toContain('content:   notes   # odd spacing stays')
    expect(next).toContain('custom_key:\n    nested:   [ 1,2 ]\n# the end\n')
  })

  test('a flow list keeps its line and its comment', () => {
    const text = 'version: 1\ncontext:\n  targets: [claude] # who reads it\n'
    expect(edit(text, { context: { targets: ['claude', 'agents'] } })).toBe(
      'version: 1\ncontext:\n  targets: [claude, agents] # who reads it\n',
    )
  })

  test('a section that only exists as comments is added and the comments stay', () => {
    const text = 'version: 1\n# freshness:\n#   stale: 10\n'
    expect(edit(text, { freshness: { stale: 4 } })).toBe(
      'version: 1\n# freshness:\n#   stale: 10\nfreshness:\n  stale: 4\n',
    )
  })

  test('an empty section is filled in place', () => {
    expect(
      edit('version: 1\ninbox:\nfreshness:\n  stale: 2\n', { inbox: { rules: { orphan: false } } }),
    ).toBe('version: 1\ninbox:\n  rules:\n    orphan: false\nfreshness:\n  stale: 2\n')
  })

  test('setting the value already there leaves the text identical', () => {
    expect(edit(handWritten, { freshness: { stale: 20 } })).toBe(handWritten)
  })

  test('CRLF files stay CRLF', () => {
    expect(edit('version: 1\r\nfreshness:\r\n  stale: 2\r\n', { freshness: { drifting: 1 } })).toBe(
      'version: 1\r\nfreshness:\r\n  stale: 2\r\n  drifting: 1\r\n',
    )
  })

  test('a file with no final newline still gets a valid new key', () => {
    expect(edit('version: 1', { context: { budget: 9 } })).toBe(
      'version: 1\ncontext:\n  budget: 9\n',
    )
  })
})

describe('what the app may write', () => {
  test.each([
    [{ content: 'elsewhere' }, ['content']],
    [{ version: 2 }, ['version']],
    [{ id_padding: 3 }, ['id_padding']],
    [{ freshness: { other: 1 } }, ['freshness', 'other']],
    [{ inbox: { other: {} } }, ['inbox', 'other']],
    [{ inbox: { rules: { 'no-such-rule': false } } }, ['inbox', 'rules', 'no-such-rule']],
    [{ inbox: { rules: { orphan: 'off' } } }, ['inbox', 'rules', 'orphan']],
    [{ freshness: 3 }, ['freshness']],
    [{ ['__proto__']: 1 }, ['__proto__']],
  ])('refuses %j', (set, path) => {
    const parsed = JSON.parse(JSON.stringify(set))
    const plan = planConfigEdits(parsed)
    expect(plan.edits).toEqual([])
    expect(plan.issues.map((i) => i.path)).toEqual(Object.keys(parsed).length ? [path] : [])
  })

  test('allows the settings the page edits', () => {
    const plan = planConfigEdits({
      states: [{ name: 'a', category: 'todo' }],
      freshness: { drifting: 1, stale: 2 },
      context: { budget: 3, targets: ['mcp'] },
      inbox: { rules: { orphan: false } },
    })
    expect(plan.issues).toEqual([])
    expect(plan.edits.map((e) => e.path.join('.'))).toEqual([
      'states',
      'freshness.drifting',
      'freshness.stale',
      'context.budget',
      'context.targets',
      'inbox.rules.orphan',
    ])
  })
})
