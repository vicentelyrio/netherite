import { describe, expect, test } from 'vitest'
import { buildContext, createItem, lint, setState } from '../src/index'
import { cleanFiles, type World, world } from './ops-helpers'

const front = (lines: string[]) => `---\n${lines.join('\n')}\n---\n`

const withDocs = () => ({
  ...cleanFiles(),
  '/repo/netherite/docs/DOC-00002-plan.md': `${front([
    'id: DOC-00002',
    'aliases: [DOC-00002]',
    'type: doc',
    'title: Plan',
  ])}\n# Plan\n\nText.\n`,
  '/repo/netherite/docs/DOC-00003-plan-two.md': `${front([
    'id: DOC-00003',
    'aliases: [DOC-00003]',
    'type: doc',
    'title: Plan two',
  ])}\n# Plan two\n\nText. See [[DOC-00002]].\n`,
  '/repo/netherite/context/CTX-00004-rules.md': `${front([
    'id: CTX-00004',
    'aliases: [CTX-00004]',
    'type: context',
    'title: Rules',
    'include_in_context: true',
  ])}\n# Rules\n\nAlways test.\n`,
})

const rules = (w: World) =>
  lint(w.repo.index, { config: w.repo.workspace.config, contentRoot: 'netherite' })

describe('retiring a doc, runbook or context item', () => {
  test('a doc is deprecated, and active again by losing its status', async () => {
    const w = await world(withDocs())
    const before = w.read('netherite/docs/DOC-00002-plan.md')
    await w.run(setState(w.repo, 'DOC-00002', 'deprecated'))
    expect(w.read('netherite/docs/DOC-00002-plan.md')).toContain('status: deprecated')
    await w.run(setState(w.repo, 'DOC-00002', 'active'))
    expect(w.read('netherite/docs/DOC-00002-plan.md')).toBe(before)
  })

  test('superseding a doc needs its replacement and writes both sides', async () => {
    const w = await world(withDocs())
    expect(await w.fail(setState(w.repo, 'DOC-00002', 'superseded'))).toMatchObject({
      issues: [{ path: ['superseded_by'] }],
    })
    await w.run(setState(w.repo, 'DOC-00002', 'superseded', { supersededBy: 'DOC-00003' }))
    const old = w.read('netherite/docs/DOC-00002-plan.md') ?? ''
    expect(old).toContain('status: superseded')
    expect(old).toContain('superseded_by: DOC-00003')
    expect(w.read('netherite/docs/DOC-00003-plan-two.md')).toContain('supersedes: [DOC-00002]')
    expect(rules(w).filter((d) => d.severity !== 'info')).toEqual([])
  })

  test('a doc cannot be replaced by an ADR, and ADR statuses are not doc statuses', async () => {
    const w = await world(withDocs())
    expect(
      await w.fail(setState(w.repo, 'DOC-00002', 'superseded', { supersededBy: 'ADR-00001' })),
    ).toMatchObject({ _tag: 'ValidationError' })
    expect(await w.fail(setState(w.repo, 'DOC-00002', 'accepted'))).toMatchObject({
      _tag: 'ValidationError',
    })
  })

  test('moving a doc out of superseded clears both sides', async () => {
    const w = await world(withDocs())
    const before = w.files()
    await w.run(setState(w.repo, 'DOC-00002', 'superseded', { supersededBy: 'DOC-00003' }))
    await w.run(setState(w.repo, 'DOC-00002', 'active'))
    expect(w.files()).toEqual(before)
  })
})

describe('what retired items are left out of', () => {
  test('lint warns when a superseded doc names no replacement', async () => {
    const w = await world(withDocs())
    await w.run(setState(w.repo, 'DOC-00002', 'deprecated'))
    w.write(
      'netherite/docs/DOC-00002-plan.md',
      (w.read('netherite/docs/DOC-00002-plan.md') as string).replace(
        'status: deprecated',
        'status: superseded',
      ),
    )
    const w2 = await world(w.files())
    expect(rules(w2).find((d) => d.rule === 'superseded-without-successor')).toMatchObject({
      severity: 'warning',
      path: 'netherite/docs/DOC-00002-plan.md',
    })
  })

  test('lint notes an active doc that links to a retired one', async () => {
    const w = await world(withDocs())
    await w.run(setState(w.repo, 'DOC-00002', 'deprecated'))
    expect(rules(w).find((d) => d.rule === 'links-to-retired')).toMatchObject({
      severity: 'info',
      path: 'netherite/docs/DOC-00003-plan-two.md',
    })
  })

  test('a retired doc nothing links to is not an orphan', async () => {
    const w = await world(withDocs())
    expect(w.repo.index.orphans()).toContain('netherite/docs/DOC-00003-plan-two.md')
    await w.run(setState(w.repo, 'DOC-00003', 'deprecated'))
    expect(w.repo.index.orphans()).not.toContain('netherite/docs/DOC-00003-plan-two.md')
  })

  test('a retired context item is not given to agents', async () => {
    const w = await world(withDocs())
    expect(buildContext(w.repo.index).included.map((i) => i.id)).toContain('CTX-00004')
    await w.run(setState(w.repo, 'CTX-00004', 'deprecated'))
    expect(buildContext(w.repo.index).included.map((i) => i.id)).not.toContain('CTX-00004')
  })

  test('a new item can be made already deprecated', async () => {
    const w = await world(withDocs())
    const r = await w.run(
      createItem(w.repo, { type: 'doc', title: 'Old', fields: { status: 'deprecated' } }),
    )
    expect(w.read(r.path)).toContain('status: deprecated')
  })
})
