import { describe, expect, test } from 'vitest'
import {
  applyChanges,
  contentHash,
  createItem,
  deleteItem,
  link,
  lint,
  markReviewed,
  readSource,
  renumber,
  replaceSource,
  setState,
  supersede,
  toggleChecklistItem,
  unlink,
  updateFields,
  updateSection,
} from '../src/index'
import { cleanFiles, type World, world } from './ops-helpers'

const task1 = 'netherite/tasks/TASK-00001-core.md'
const task2 = 'netherite/tasks/TASK-00002-cli.md'
const adr1 = 'netherite/adr/ADR-00001-callbacks.md'
const adr2 = 'netherite/adr/ADR-00002-promises.md'
const adr3 = 'netherite/adr/ADR-00003-logging.md'
const doc1 = 'netherite/docs/DOC-00001-overview.md'

const diagnostics = (w: World) =>
  lint(w.repo.index, { config: w.repo.workspace.config, contentRoot: 'netherite' }).filter(
    (d) => d.severity !== 'info',
  )

const lines = (text: string | undefined) => (text ?? '').split('\n')
const changedLineCount = (before: string, after: string) => {
  const a = lines(before)
  const b = lines(after)
  let s = 0
  while (s < a.length && s < b.length && a[s] === b[s]) s++
  let ea = a.length
  let eb = b.length
  while (ea > s && eb > s && a[ea - 1] === b[eb - 1]) {
    ea--
    eb--
  }
  return Math.max(ea - s, eb - s)
}

test('the starting workspace is clean', async () => {
  expect(diagnostics(await world())).toEqual([])
})

describe('createItem', () => {
  test('creates a task with the next id, in its folder, with defaults', async () => {
    const w = await world()
    const result = await w.run(
      createItem(w.repo, {
        type: 'task',
        title: 'Write the docs',
        fields: { project: 'PRJ-00001', labels: ['docs'] },
        createdBy: '@ada',
      }),
    )
    expect(result).toMatchObject({
      id: 'TASK-00003',
      path: 'netherite/tasks/TASK-00003-write-the-docs.md',
      unchanged: false,
      changed: ['netherite/tasks/TASK-00003-write-the-docs.md'],
    })
    expect(w.read(result.path)).toBe(
      [
        '---',
        'id: TASK-00003',
        'aliases: [TASK-00003]',
        'type: task',
        'title: Write the docs',
        'created: 2026-03-05T10:30:00Z',
        'created_by: "@ada"',
        'project: PRJ-00001',
        'state: backlog',
        'labels: [docs]',
        '---',
        '',
        '# Write the docs',
        '',
      ].join('\n'),
    )
  })

  test('the new item is in the index and the workspace still lints clean', async () => {
    const w = await world()
    await w.run(createItem(w.repo, { type: 'task', title: 'X', fields: { project: 'PRJ-00001' } }))
    expect(w.repo.index.findById('TASK-00003')).toHaveLength(1)
    expect(diagnostics(w)).toEqual([])
  })

  test('ids keep counting up', async () => {
    const w = await world()
    const a = await w.run(createItem(w.repo, { type: 'doc', title: 'A' }))
    const b = await w.run(createItem(w.repo, { type: 'doc', title: 'B' }))
    expect([a.id, b.id]).toEqual(['DOC-00002', 'DOC-00003'])
  })

  test('an ADR starts proposed, dated, with its sections', async () => {
    const w = await world()
    const result = await w.run(
      createItem(w.repo, { type: 'adr', title: 'Use stow', createdBy: '@ada' }),
    )
    const text = w.read(result.path) ?? ''
    expect(text).toContain('status: proposed')
    expect(text).toContain('date: 2026-03-05')
    expect(text).toContain('deciders: ["@ada"]')
    expect(text).toContain('## Context\n\n## Decision\n\n## Consequences\n')
  })

  test('a goal and a project get an active status', async () => {
    const w = await world()
    const goal = await w.run(createItem(w.repo, { type: 'goal', title: 'G2' }))
    expect(w.read(goal.path)).toContain('status: active')
    const project = await w.run(
      createItem(w.repo, { type: 'project', title: 'P2', fields: { goals: [goal.id] } }),
    )
    expect(w.read(project.path)).toContain('goals: [GOAL-00002]')
  })

  test('the first todo state is the default task state', async () => {
    const w = await world({
      ...cleanFiles(),
      '/repo/.netherite/config.yml':
        'version: 1\nstates:\n  - { name: open, category: todo }\n  - { name: closed, category: done }\n',
    })
    const result = await w.run(
      createItem(w.repo, { type: 'task', title: 'T', fields: { project: 'PRJ-00001' } }),
    )
    expect(w.read(result.path)).toContain('state: open')
  })

  test('a body is written after the title heading', async () => {
    const w = await world()
    const result = await w.run(
      createItem(w.repo, { type: 'doc', title: 'Notes', body: 'Some text.' }),
    )
    expect(w.read(result.path)?.endsWith('# Notes\n\nSome text.\n')).toBe(true)
  })

  test('a field-level error for a task that points at a missing project', async () => {
    const w = await world()
    const before = w.files()
    const error = await w.fail(
      createItem(w.repo, { type: 'task', title: 'X', fields: { project: 'PRJ-00404' } }),
    )
    expect(error).toMatchObject({
      _tag: 'ValidationError',
      issues: [{ path: ['project'], message: 'PRJ-00404 does not match any item' }],
    })
    expect(w.files()).toEqual(before)
  })

  test('a project without goals is refused', async () => {
    const w = await world()
    const error = await w.fail(createItem(w.repo, { type: 'project', title: 'P' }))
    expect(error).toMatchObject({ _tag: 'ValidationError' })
    expect((error as unknown as { issues: Array<{ path: string[] }> }).issues[0]?.path[0]).toBe(
      'goals',
    )
  })

  test('fields the operation sets itself cannot be given', async () => {
    const w = await world()
    const error = await w.fail(
      createItem(w.repo, { type: 'doc', title: 'D', fields: { id: 'DOC-00099' } }),
    )
    expect(error).toMatchObject({ _tag: 'ValidationError', issues: [{ path: ['id'] }] })
  })

  test('a bad value is reported against its field', async () => {
    const w = await world()
    const error = await w.fail(
      createItem(w.repo, {
        type: 'task',
        title: 'T',
        fields: { project: 'PRJ-00001', due: 'soon' },
      }),
    )
    expect(error).toMatchObject({ _tag: 'ValidationError', issues: [{ path: ['due'] }] })
  })

  test('a title that needs quoting is quoted', async () => {
    const w = await world()
    const result = await w.run(createItem(w.repo, { type: 'doc', title: 'Why: a "question"' }))
    expect(w.read(result.path)).toContain(`title: 'Why: a "question"'`)
    expect(diagnostics(w)).toEqual([])
  })
})

describe('updateFields', () => {
  test('changes one field and nothing else', async () => {
    const w = await world()
    const before = w.read(task1) as string
    const result = await w.run(updateFields(w.repo, 'TASK-00001', { set: { state: 'doing' } }))
    const after = w.read(task1) as string
    expect(after).toBe(before.replace('state: backlog', 'state: doing'))
    expect(changedLineCount(before, after)).toBe(1)
    expect(result.hash).toBe(contentHash(after))
  })

  test('a new title also changes the heading, and only that much', async () => {
    const w = await world()
    const before = w.read(task1) as string
    await w.run(updateFields(w.repo, 'TASK-00001', { set: { title: 'Core library' } }))
    const after = w.read(task1) as string
    expect(after).toBe(
      before
        .replace('title: Core', 'title: Core library')
        .replace('\n# Core\n', '\n# Core library\n'),
    )
    expect(w.repo.index.get(task1)?.title).toBe('Core library')
  })

  test('sets and unsets in one call', async () => {
    const w = await world()
    await w.run(
      updateFields(w.repo, 'TASK-00001', { set: { assignees: ['@ada'] }, unset: ['labels'] }),
    )
    const text = w.read(task1) ?? ''
    expect(text).toContain('assignees: ["@ada"]')
    expect(text).not.toContain('labels')
  })

  test('an invalid value is refused and the file is untouched', async () => {
    const w = await world()
    const before = w.files()
    const error = await w.fail(updateFields(w.repo, 'TASK-00001', { set: { state: 'waiting' } }))
    expect(error).toMatchObject({ _tag: 'ValidationError', issues: [{ path: ['state'] }] })
    expect(w.files()).toEqual(before)
  })

  test('a relationship to a missing item is refused', async () => {
    const w = await world()
    const error = await w.fail(
      updateFields(w.repo, 'TASK-00001', { set: { project: 'PRJ-00404' } }),
    )
    expect(error).toMatchObject({
      issues: [{ path: ['project'], message: 'PRJ-00404 does not match any item' }],
    })
  })

  test('removing a required field is refused', async () => {
    const w = await world()
    const error = await w.fail(updateFields(w.repo, 'TASK-00001', { unset: ['project'] }))
    expect(error).toMatchObject({ _tag: 'ValidationError', issues: [{ path: ['project'] }] })
  })

  test('the id and type cannot be changed this way', async () => {
    const w = await world()
    const error = await w.fail(
      updateFields(w.repo, 'TASK-00001', { set: { id: 'TASK-00009', type: 'doc' } }),
    )
    expect(error).toMatchObject({ issues: [{ path: ['id'] }, { path: ['type'] }] })
  })

  test('aliases must keep the id', async () => {
    const w = await world()
    const error = await w.fail(updateFields(w.repo, 'TASK-00001', { set: { aliases: ['nope'] } }))
    expect(error).toMatchObject({
      issues: [{ path: ['aliases'], message: 'Must include the ID TASK-00001' }],
    })
  })

  test('an unknown id is NotFound', async () => {
    const w = await world()
    expect(await w.fail(updateFields(w.repo, 'TASK-09999', { set: { title: 'x' } }))).toMatchObject(
      {
        _tag: 'NotFound',
        id: 'TASK-09999',
      },
    )
  })

  test('an edit that changes nothing writes nothing', async () => {
    const w = await world()
    const result = await w.run(updateFields(w.repo, 'TASK-00001', { set: { title: 'Core' } }))
    expect(result).toMatchObject({ unchanged: true, changed: [] })
  })

  test('an existing problem elsewhere in the file does not block an unrelated edit', async () => {
    const files = cleanFiles()
    files['/repo/netherite/tasks/TASK-00001-core.md'] = (
      files['/repo/netherite/tasks/TASK-00001-core.md'] as string
    ).replace('labels: [backend]', 'due: someday')
    const w = await world(files)
    const result = await w.run(updateFields(w.repo, 'TASK-00001', { set: { title: 'Better' } }))
    expect(result.unchanged).toBe(false)
    expect(w.read(task1)).toContain('due: someday')
  })
})

describe('concurrency', () => {
  test('a stale base hash is a conflict and nothing is written', async () => {
    const w = await world()
    const stale = contentHash('something else')
    const before = w.files()
    const error = await w.fail(
      updateFields(w.repo, 'TASK-00001', { set: { title: 'x' } }, { baseHash: stale }),
    )
    expect(error).toMatchObject({ _tag: 'ConflictError', path: task1, expected: stale })
    expect(w.files()).toEqual(before)
  })

  test('the hash from one result is the base of the next', async () => {
    const w = await world()
    const first = await w.run(updateFields(w.repo, 'TASK-00001', { set: { title: 'One' } }))
    const second = await w.run(
      updateFields(w.repo, 'TASK-00001', { set: { title: 'Two' } }, { baseHash: first.hash }),
    )
    expect(second.unchanged).toBe(false)
    const error = await w.fail(
      updateFields(w.repo, 'TASK-00001', { set: { title: 'Three' } }, { baseHash: first.hash }),
    )
    expect(error._tag).toBe('ConflictError')
  })

  test('a file that changed between reading and writing is a conflict', async () => {
    const w = await world()
    const current = w.read(task1) as string
    const error = await w.fail(
      applyChanges(w.repo, [
        { path: task1, content: `${current}\nextra\n`, before: `${current}different` },
      ]),
    )
    expect(error).toMatchObject({ _tag: 'ConflictError' })
    expect(w.read(task1)).toBe(current)
  })

  test('creating over an existing file is refused', async () => {
    const w = await world()
    const error = await w.fail(applyChanges(w.repo, [{ path: task1, content: 'x', before: null }]))
    expect(error).toMatchObject({ _tag: 'AlreadyExists', path: task1 })
  })

  test('writes leave no temporary files behind', async () => {
    const w = await world()
    await w.run(updateFields(w.repo, 'TASK-00001', { set: { title: 'x' } }))
    await w.run(createItem(w.repo, { type: 'doc', title: 'New' }))
    expect(Object.keys(w.files()).filter((f) => f.endsWith('.tmp'))).toEqual([])
  })

  test('a failure while moving files rolls everything back', async () => {
    let renames = 0
    const w = await world(cleanFiles(), {
      failWhen: (method, path) => {
        if (method === 'rename' && path.endsWith('.tmp') && ++renames === 2) return 'disk full'
        return undefined
      },
    })
    const before = w.files()
    const error = await w.fail(supersede(w.repo, { old: 'ADR-00001', by: 'ADR-00002' }))
    expect(error).toMatchObject({ _tag: 'IoError' })
    expect(w.files()).toEqual(before)
    expect(w.repo.index.get(adr1)?.parsed.source).toBe(before[`/repo/${adr1}`])
  })
})

describe('setState', () => {
  test('moves a task to another state', async () => {
    const w = await world()
    await w.run(setState(w.repo, 'TASK-00001', 'doing'))
    expect(w.read(task1)).toContain('state: doing')
  })

  test('an unknown state is refused', async () => {
    const w = await world()
    expect(await w.fail(setState(w.repo, 'TASK-00001', 'nope'))).toMatchObject({
      _tag: 'ValidationError',
      issues: [{ path: ['state'] }],
    })
  })

  test('accepts a proposed ADR', async () => {
    const w = await world()
    await w.run(setState(w.repo, 'ADR-00003', 'accepted'))
    expect(w.read(adr3)).toContain('status: accepted')
  })

  test('superseding updates both ADRs', async () => {
    const w = await world()
    const result = await w.run(
      setState(w.repo, 'ADR-00001', 'superseded', { supersededBy: 'ADR-00002' }),
    )
    expect([...result.changed].sort()).toEqual([adr1, adr2])
    const old = w.read(adr1) ?? ''
    expect(old).toContain('status: superseded')
    expect(old).toContain('superseded_by: ADR-00002')
    expect(w.read(adr2)).toContain('supersedes: [ADR-00001]')
    expect(
      w.repo.index.graph
        .edges()
        .some((e) => w.repo.index.graph.getEdgeAttribute(e, 'kind') === 'supersedes'),
    ).toBe(true)
    expect(diagnostics(w)).toEqual([])
  })

  test('superseding needs to say by which ADR', async () => {
    const w = await world()
    expect(await w.fail(setState(w.repo, 'ADR-00001', 'superseded'))).toMatchObject({
      issues: [{ path: ['superseded_by'] }],
    })
  })

  test('moving an ADR out of superseded clears both sides', async () => {
    const w = await world()
    const before = w.files()
    await w.run(supersede(w.repo, { old: 'ADR-00001', by: 'ADR-00002' }))
    const result = await w.run(setState(w.repo, 'ADR-00001', 'accepted'))
    expect([...result.changed].sort()).toEqual([adr1, adr2])
    expect(w.files()).toEqual(before)
  })

  test('an ADR cannot supersede itself or a non-ADR', async () => {
    const w = await world()
    expect(await w.fail(supersede(w.repo, { old: 'ADR-00001', by: 'ADR-00001' }))).toMatchObject({
      _tag: 'ValidationError',
    })
    expect(await w.fail(supersede(w.repo, { old: 'ADR-00001', by: 'DOC-00001' }))).toMatchObject({
      _tag: 'ValidationError',
    })
  })

  test('only tasks and ADRs have a state', async () => {
    const w = await world()
    expect(await w.fail(setState(w.repo, 'DOC-00001', 'done'))).toMatchObject({
      _tag: 'ValidationError',
    })
  })

  test('if the second ADR cannot be written, the first is left alone', async () => {
    const files = cleanFiles()
    files['/repo/netherite/adr/ADR-00002-promises.md'] = (
      files['/repo/netherite/adr/ADR-00002-promises.md'] as string
    ).replace('supersedes', 'supersedes')
    const w = await world(files)
    const before = w.files()
    const error = await w.fail(supersede(w.repo, { old: 'ADR-00001', by: 'ADR-00001' }))
    expect(error._tag).toBe('ValidationError')
    expect(w.files()).toEqual(before)
  })
})

describe('link and unlink', () => {
  test('adds and removes a dependency', async () => {
    const w = await world()
    await w.run(unlink(w.repo, { from: 'TASK-00002', to: 'TASK-00001', kind: 'depends_on' }))
    expect(w.read(task2)).not.toContain('depends_on')
    await w.run(link(w.repo, { from: 'TASK-00002', to: 'TASK-00001', kind: 'depends_on' }))
    expect(w.read(task2)).toContain('depends_on: [TASK-00001]')
  })

  test('relates a task to any item', async () => {
    const w = await world()
    await w.run(link(w.repo, { from: 'TASK-00001', to: 'DOC-00001', kind: 'related' }))
    expect(w.read(task1)).toContain('related: [DOC-00001]')
    expect(w.repo.index.outgoing(task1).some((e) => e.kind === 'related')).toBe(true)
  })

  test('linking the same thing twice changes nothing', async () => {
    const w = await world()
    const input = { from: 'TASK-00002', to: 'TASK-00001', kind: 'depends_on' } as const
    expect((await w.run(link(w.repo, input))).unchanged).toBe(true)
  })

  test('a single-valued relationship is replaced', async () => {
    const w = await world()
    await w.run(createItem(w.repo, { type: 'goal', title: 'G' }))
    const p = await w.run(
      createItem(w.repo, { type: 'project', title: 'P', fields: { goals: ['GOAL-00001'] } }),
    )
    await w.run(link(w.repo, { from: 'TASK-00001', to: p.id, kind: 'belongs_to' }))
    expect(w.read(task1)).toContain(`project: ${p.id}`)
  })

  test('a required relationship cannot be removed', async () => {
    const w = await world()
    expect(
      await w.fail(unlink(w.repo, { from: 'TASK-00001', to: 'PRJ-00001', kind: 'belongs_to' })),
    ).toMatchObject({
      _tag: 'ValidationError',
      issues: [{ path: ['project'] }],
    })
  })

  test('a doc explains an item', async () => {
    const w = await world()
    await w.run(link(w.repo, { from: 'DOC-00001', to: 'TASK-00001', kind: 'explains' }))
    expect(w.read(doc1)).toContain('explains: [PRJ-00001, TASK-00001]')
  })

  test('a kind the type does not have is refused', async () => {
    const w = await world()
    expect(
      await w.fail(link(w.repo, { from: 'DOC-00001', to: 'TASK-00001', kind: 'depends_on' })),
    ).toMatchObject({
      _tag: 'ValidationError',
      issues: [{ path: ['depends_on'] }],
    })
  })

  test('a target that does not exist is NotFound', async () => {
    const w = await world()
    expect(
      await w.fail(link(w.repo, { from: 'TASK-00002', to: 'TASK-09999', kind: 'depends_on' })),
    ).toMatchObject({
      _tag: 'NotFound',
      id: 'TASK-09999',
    })
  })

  test('a type mismatch is caught by the schema', async () => {
    const w = await world()
    expect(
      await w.fail(link(w.repo, { from: 'TASK-00001', to: 'DOC-00001', kind: 'belongs_to' })),
    ).toMatchObject({
      _tag: 'ValidationError',
      issues: [{ path: ['project'] }],
    })
  })

  test('supersedes goes through supersession on both ADRs', async () => {
    const w = await world()
    await w.run(link(w.repo, { from: 'ADR-00002', to: 'ADR-00001', kind: 'supersedes' }))
    expect(w.read(adr1)).toContain('superseded_by: ADR-00002')
    await w.run(unlink(w.repo, { from: 'ADR-00002', to: 'ADR-00001', kind: 'supersedes' }))
    expect(w.read(adr1)).toContain('status: accepted')
    expect(w.read(adr1)).not.toContain('superseded_by')
    expect(w.read(adr2)).not.toContain('supersedes')
  })
})

describe('checklists and sections', () => {
  test('ticks one item', async () => {
    const w = await world()
    const before = w.read(task1) as string
    await w.run(toggleChecklistItem(w.repo, 'TASK-00001', 0))
    expect(w.read(task1)).toBe(before.replace('- [ ] first', '- [x] first'))
    expect(w.repo.index.progress(task1)).toEqual({ done: 2, total: 3 })
  })

  test('sets an item to a given state', async () => {
    const w = await world()
    expect((await w.run(toggleChecklistItem(w.repo, 'TASK-00001', 1, true))).unchanged).toBe(true)
    await w.run(toggleChecklistItem(w.repo, 'TASK-00001', { text: 'second' }, false))
    expect(w.read(task1)).toContain('- [ ] second')
  })

  test('a missing item is an edit error', async () => {
    const w = await world()
    expect(await w.fail(toggleChecklistItem(w.repo, 'TASK-00001', 9))).toMatchObject({
      _tag: 'EditError',
      reason: 'no-such-check',
    })
  })

  test('replaces, appends to and creates sections', async () => {
    const w = await world()
    await w.run(updateSection(w.repo, 'TASK-00001', { heading: 'Notes', content: 'New notes.' }))
    expect(w.read(task1)?.endsWith('## Notes\n\nNew notes.\n')).toBe(true)
    await w.run(
      updateSection(w.repo, 'TASK-00001', { heading: 'Notes', content: 'More.', mode: 'append' }),
    )
    expect(w.read(task1)?.endsWith('New notes.\n\nMore.\n')).toBe(true)
    await w.run(
      updateSection(w.repo, 'TASK-00001', { heading: 'Log', content: 'Started.', mode: 'create' }),
    )
    expect(w.read(task1)?.endsWith('## Log\n\nStarted.\n')).toBe(true)
  })

  test('a section that is not there is an edit error', async () => {
    const w = await world()
    expect(
      await w.fail(updateSection(w.repo, 'TASK-00001', { heading: 'Nope', content: 'x' })),
    ).toMatchObject({
      _tag: 'EditError',
      reason: 'no-such-section',
    })
  })
})

describe('markReviewed', () => {
  test('sets today from the clock', async () => {
    const w = await world()
    await w.run(markReviewed(w.repo, 'DOC-00001'))
    expect(w.read(doc1)).toContain('reviewed_at: 2026-03-05')
  })

  test('takes an explicit date', async () => {
    const w = await world()
    await w.run(markReviewed(w.repo, 'DOC-00001', { date: '2026-02-01' }))
    expect(w.read(doc1)).toContain('reviewed_at: 2026-02-01')
  })

  test('adds the field in schema order when it is missing', async () => {
    const files = cleanFiles()
    files['/repo/netherite/docs/DOC-00001-overview.md'] = (
      files['/repo/netherite/docs/DOC-00001-overview.md'] as string
    ).replace('reviewed_at: 2026-01-01\n', '')
    const w = await world(files)
    await w.run(markReviewed(w.repo, 'DOC-00001'))
    expect(w.read(doc1)).toContain('covers: ["src/**"]\nreviewed_at: 2026-03-05\n---')
  })

  test('only docs, runbooks and context can be reviewed', async () => {
    const w = await world()
    expect(await w.fail(markReviewed(w.repo, 'TASK-00001'))).toMatchObject({
      _tag: 'ValidationError',
    })
  })
})

describe('deleteItem', () => {
  test('refuses while other items link to it', async () => {
    const w = await world()
    const before = w.files()
    const error = await w.fail(deleteItem(w.repo, 'TASK-00001'))
    expect(error).toMatchObject({ _tag: 'StillLinked', id: 'TASK-00001' })
    expect(
      (error as unknown as { referrers: Array<{ path: string }> }).referrers.map((r) => r.path),
    ).toContain(task2)
    expect(w.files()).toEqual(before)
  })

  test('deletes with force, and the index forgets it', async () => {
    const w = await world()
    await w.run(deleteItem(w.repo, 'TASK-00001', { force: true }))
    expect(w.read(task1)).toBeUndefined()
    expect(w.repo.index.findById('TASK-00001')).toEqual([])
    expect(diagnostics(w).some((d) => d.rule === 'broken-link')).toBe(true)
  })

  test('deletes an item nothing links to', async () => {
    const w = await world()
    const doc = await w.run(createItem(w.repo, { type: 'doc', title: 'Scratch' }))
    expect(await w.run(deleteItem(w.repo, doc.id))).toEqual({ id: doc.id, path: doc.path })
    expect(w.read(doc.path)).toBeUndefined()
  })

  test('a stale base hash blocks the delete', async () => {
    const w = await world()
    const doc = await w.run(createItem(w.repo, { type: 'doc', title: 'Scratch' }))
    expect(await w.fail(deleteItem(w.repo, doc.id, { baseHash: 'x' }))).toMatchObject({
      _tag: 'ConflictError',
    })
  })

  test('an id shared by two items is ambiguous', async () => {
    const files = cleanFiles()
    files['/repo/netherite/tasks/TASK-00001-copy.md'] = files[
      '/repo/netherite/tasks/TASK-00001-core.md'
    ] as string
    const w = await world(files)
    expect(await w.fail(deleteItem(w.repo, 'TASK-00001', { force: true }))).toMatchObject({
      _tag: 'AmbiguousId',
    })
  })
})

describe('renumber', () => {
  test('gives the item a new id and rewrites every link to it', async () => {
    const w = await world()
    const result = await w.run(renumber(w.repo, task1, { newId: 'TASK-00050' }))

    expect(result).toMatchObject({
      oldId: 'TASK-00001',
      newId: 'TASK-00050',
      oldPath: task1,
      path: 'netherite/tasks/TASK-00050-core.md',
    })
    expect(w.read(task1)).toBeUndefined()
    const moved = w.read(result.path) ?? ''
    expect(moved).toContain('id: TASK-00050')
    expect(moved).toContain('aliases: [TASK-00050]')
    expect(moved).toContain('- [ ] first')

    const referrer = w.read(task2) ?? ''
    expect(referrer).toContain('depends_on: [TASK-00050]')
    expect(referrer).toContain(
      '[[TASK-00050]] and [[TASK-00050|the core]]; see [[TASK-00050#Notes]]',
    )
    expect(result.rewritten).toEqual([task2])
    expect(diagnostics(w)).toEqual([])
  })

  test('defaults to the next free id', async () => {
    const w = await world()
    const result = await w.run(renumber(w.repo, task1))
    expect(result.newId).toBe('TASK-00003')
    expect(diagnostics(w)).toEqual([])
  })

  test('rewrites links in a single-valued field and in the body of other types', async () => {
    const w = await world()
    await w.run(renumber(w.repo, 'netherite/projects/PRJ-00001-app.md', { newId: 'PRJ-00007' }))
    expect(w.read(task1)).toContain('project: PRJ-00007')
    expect(w.read(doc1)).toContain('explains: [PRJ-00007]')
    expect(w.read('netherite/goals/GOAL-00001-ship.md')).toContain('See [[PRJ-00007]].')
    expect(diagnostics(w)).toEqual([])
  })

  test('links by file name follow the rename', async () => {
    const files = cleanFiles()
    files['/repo/netherite/docs/DOC-00001-overview.md'] += '\nBy name: [[TASK-00001-core]].\n'
    const w = await world(files)
    await w.run(renumber(w.repo, task1, { newId: 'TASK-00050' }))
    expect(w.read(doc1)).toContain('By name: [[TASK-00050-core]].')
  })

  test('a duplicate id only follows the links in the files you name', async () => {
    const files = cleanFiles()
    files['/repo/netherite/tasks/TASK-00001-newer.md'] = (
      files['/repo/netherite/tasks/TASK-00001-core.md'] as string
    ).replace('title: Core', 'title: Newer')
    files['/repo/netherite/tasks/TASK-00005-uses-newer.md'] =
      '---\nid: TASK-00005\naliases: [TASK-00005]\ntype: task\ntitle: Uses newer\nproject: PRJ-00001\nstate: backlog\n---\n\nSee [[TASK-00001]].\n'
    const w = await world(files)
    const newer = 'netherite/tasks/TASK-00001-newer.md'
    const result = await w.run(
      renumber(w.repo, newer, {
        newId: 'TASK-00060',
        rewriteReferencesIn: ['netherite/tasks/TASK-00005-uses-newer.md'],
      }),
    )
    expect(result.rewritten).toEqual(['netherite/tasks/TASK-00005-uses-newer.md'])
    expect(w.read('netherite/tasks/TASK-00005-uses-newer.md')).toContain('See [[TASK-00060]].')
    // The older item's links keep pointing at it.
    expect(w.read(task2)).toContain('[[TASK-00001]]')
    expect(w.repo.index.findById('TASK-00001')).toHaveLength(1)
  })

  test('without naming files, ambiguous links are left alone', async () => {
    const files = cleanFiles()
    files['/repo/netherite/tasks/TASK-00001-newer.md'] = (
      files['/repo/netherite/tasks/TASK-00001-core.md'] as string
    ).replace('title: Core', 'title: Newer')
    const w = await world(files)
    const result = await w.run(
      renumber(w.repo, 'netherite/tasks/TASK-00001-newer.md', { newId: 'TASK-00060' }),
    )
    expect(result.rewritten).toEqual([])
    expect(w.read(task2)).toContain('depends_on: [TASK-00001]')
  })

  test('refuses an id that is taken or of the wrong type', async () => {
    const w = await world()
    expect(await w.fail(renumber(w.repo, task1, { newId: 'TASK-00002' }))).toMatchObject({
      _tag: 'ValidationError',
    })
    expect(await w.fail(renumber(w.repo, task1, { newId: 'DOC-00050' }))).toMatchObject({
      _tag: 'ValidationError',
    })
  })

  test('is all or nothing when a write fails', async () => {
    let renames = 0
    const w = await world(cleanFiles(), {
      failWhen: (method, path) =>
        method === 'rename' && path.endsWith('.tmp') && ++renames === 2 ? 'disk full' : undefined,
    })
    const before = w.files()
    expect(await w.fail(renumber(w.repo, task1, { newId: 'TASK-00050' }))).toMatchObject({
      _tag: 'IoError',
    })
    expect(w.files()).toEqual(before)
  })

  test('an unknown path is NotFound', async () => {
    const w = await world()
    expect(await w.fail(renumber(w.repo, 'netherite/tasks/nope.md'))).toMatchObject({
      _tag: 'NotFound',
    })
  })
})

describe('readSource and replaceSource', () => {
  test('readSource gives the whole file and its hash', async () => {
    const w = await world()
    const source = await w.run(readSource(w.repo, 'TASK-00001'))
    expect(source.path).toBe('netherite/tasks/TASK-00001-core.md')
    expect(source.text).toBe(w.read('netherite/tasks/TASK-00001-core.md'))
    expect(source.hash).toBe(contentHash(source.text))
  })

  test('replaces the file with the new text, and the result has the new hash', async () => {
    const w = await world()
    const { text, hash } = await w.run(readSource(w.repo, 'TASK-00001'))
    const next = text.replace('Plain notes.', 'Edited in an editor.')
    const result = await w.run(replaceSource(w.repo, 'TASK-00001', next, { baseHash: hash }))
    expect(w.read('netherite/tasks/TASK-00001-core.md')).toBe(next)
    expect(result.hash).toBe(contentHash(next))
    expect(result.unchanged).toBe(false)
  })

  test('saving the same text changes nothing', async () => {
    const w = await world()
    const { text, hash } = await w.run(readSource(w.repo, 'TASK-00001'))
    expect(
      (await w.run(replaceSource(w.repo, 'TASK-00001', text, { baseHash: hash }))).unchanged,
    ).toBe(true)
  })

  test('a file that changed since it was read is a conflict, and is left alone', async () => {
    const w = await world()
    const { text, hash } = await w.run(readSource(w.repo, 'TASK-00001'))
    w.write('netherite/tasks/TASK-00001-core.md', `${text}\nsomeone else\n`)
    const error = await w.fail(
      replaceSource(w.repo, 'TASK-00001', `${text}\nmine\n`, { baseHash: hash }),
    )
    expect(error).toMatchObject({ _tag: 'ConflictError' })
    expect(w.read('netherite/tasks/TASK-00001-core.md')).toBe(`${text}\nsomeone else\n`)
  })

  test('the id and the type cannot be changed this way', async () => {
    const w = await world()
    const { text } = await w.run(readSource(w.repo, 'TASK-00001'))
    const renamed = await w.fail(
      replaceSource(w.repo, 'TASK-00001', text.replace('id: TASK-00001', 'id: TASK-00099')),
    )
    expect(renamed).toMatchObject({ _tag: 'ValidationError', issues: [{ path: ['id'] }] })
    const retyped = await w.fail(
      replaceSource(w.repo, 'TASK-00001', text.replace('type: task', 'type: doc')),
    )
    expect(retyped._tag).toBe('ValidationError')
    expect(w.read('netherite/tasks/TASK-00001-core.md')).toBe(text)
  })

  test('new schema problems are refused, with the field; problems that were already there are not', async () => {
    const w = await world()
    const { text } = await w.run(readSource(w.repo, 'TASK-00001'))
    const error = await w.fail(
      replaceSource(w.repo, 'TASK-00001', text.replace('state: backlog', 'state: nonsense')),
    )
    expect(error).toMatchObject({ _tag: 'ValidationError', issues: [{ path: ['state'] }] })
  })

  test('an unknown item is not found', async () => {
    const w = await world()
    expect(await w.fail(replaceSource(w.repo, 'TASK-09999', 'x'))).toMatchObject({
      _tag: 'NotFound',
    })
  })
})
