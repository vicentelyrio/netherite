import { describe, expect, test } from 'vitest'
import { applyFixes, lint, renameFile } from '../src/index'
import { cleanFiles, type World, world } from './ops-helpers'

const diagnostics = (w: World) =>
  lint(w.repo.index, { config: w.repo.workspace.config, contentRoot: 'netherite' })

const front = (id: string, extra = '') =>
  `---\nid: ${id}\naliases: [${id}]\ntype: doc\ntitle: T ${id}\n${extra}---\n\nBody.\n`

describe('renameFile', () => {
  test('moves the file and rewrites links by file name, not links by id', async () => {
    const files = cleanFiles()
    files['/repo/netherite/docs/DOC-00002-linker.md'] =
      `${front('DOC-00002')}By name [[TASK-00001-core]] and [[TASK-00001-core|label]] and by id [[TASK-00001]] and [[tasks/TASK-00001-core#Notes]].\n`
    const w = await world(files)
    const result = await w.run(
      renameFile(
        w.repo,
        'netherite/tasks/TASK-00001-core.md',
        'netherite/tasks/TASK-00001-core-library.md',
      ),
    )
    expect(result).toMatchObject({
      oldPath: 'netherite/tasks/TASK-00001-core.md',
      path: 'netherite/tasks/TASK-00001-core-library.md',
      id: 'TASK-00001',
    })
    expect(w.read('netherite/tasks/TASK-00001-core.md')).toBeUndefined()
    expect(w.read('netherite/tasks/TASK-00001-core-library.md')).toContain('# Core')
    const linker = w.read('netherite/docs/DOC-00002-linker.md') ?? ''
    expect(linker).toContain('[[TASK-00001-core-library]] and [[TASK-00001-core-library|label]]')
    expect(linker).toContain('by id [[TASK-00001]]')
    expect(linker).toContain('[[tasks/TASK-00001-core-library#Notes]]')
    expect(result.rewritten).toEqual(['netherite/docs/DOC-00002-linker.md'])
    expect(diagnostics(w).filter((d) => d.severity !== 'info')).toEqual([])
  })

  test('refuses to overwrite, and a missing source is NotFound', async () => {
    const w = await world()
    const before = w.files()
    expect(
      await w.fail(
        renameFile(
          w.repo,
          'netherite/tasks/TASK-00001-core.md',
          'netherite/tasks/TASK-00002-cli.md',
        ),
      ),
    ).toMatchObject({ _tag: 'AlreadyExists' })
    expect(
      await w.fail(renameFile(w.repo, 'netherite/tasks/nope.md', 'netherite/tasks/x.md')),
    ).toMatchObject({ _tag: 'NotFound' })
    expect(w.files()).toEqual(before)
  })

  test('renaming to the same path changes nothing', async () => {
    const w = await world()
    expect(
      (
        await w.run(
          renameFile(
            w.repo,
            'netherite/tasks/TASK-00001-core.md',
            'netherite/tasks/TASK-00001-core.md',
          ),
        )
      ).unchanged,
    ).toBe(true)
  })

  test('can move to another folder', async () => {
    const w = await world()
    await w.run(
      renameFile(
        w.repo,
        'netherite/docs/DOC-00001-overview.md',
        'netherite/docs/guides/DOC-00001-overview.md',
      ),
    )
    expect(w.read('netherite/docs/guides/DOC-00001-overview.md')).toContain('# Overview')
  })
})

describe('applyFixes', () => {
  const broken = () => {
    const files = cleanFiles()
    files['/repo/netherite/tasks/TASK-00001-core.md'] = (
      files['/repo/netherite/tasks/TASK-00001-core.md'] as string
    ).replace('aliases: [TASK-00001]', 'aliases: [other]')
    files['/repo/netherite/docs/notes.md'] = front('DOC-00005')
    files['/repo/netherite/docs/DOC-00007-links.md'] = `${front('DOC-00007')}See [[notes]].\n`
    files['/repo/netherite/docs/misc.md'] = front('DOC-00006').replace(
      'aliases: [DOC-00006]',
      'aliases: []',
    )
    return files
  }

  test('lint offers the fixes', async () => {
    const w = await world(broken())
    const fixes = diagnostics(w).flatMap((d) => (d.fix ? [d.fix.kind] : []))
    expect(fixes.sort()).toEqual(['add-alias', 'add-alias', 'rename-file', 'rename-file'])
  })

  test('a dry run reports the changes and touches nothing', async () => {
    const w = await world(broken())
    const before = w.files()
    const indexBefore = w.repo.index.paths()
    const report = await w.run(applyFixes(w.repo, diagnostics(w), { dryRun: true }))
    expect(report.applied).toHaveLength(4)
    expect(report.skipped).toEqual([])
    expect(
      report.changes
        .map((c) => [c.path, c.before === null ? 'new' : c.after === null ? 'deleted' : 'edited'])
        .sort(),
    ).toEqual([
      ['netherite/docs/DOC-00005-notes.md', 'new'],
      ['netherite/docs/DOC-00006-misc.md', 'new'],
      ['netherite/docs/DOC-00007-links.md', 'edited'],
      ['netherite/docs/misc.md', 'deleted'],
      ['netherite/docs/notes.md', 'deleted'],
      ['netherite/tasks/TASK-00001-core.md', 'edited'],
    ])
    expect(w.files()).toEqual(before)
    expect(w.repo.index.paths()).toEqual(indexBefore)
  })

  test('applying fixes clears every fixable problem, in one go', async () => {
    const w = await world(broken())
    const report = await w.run(applyFixes(w.repo, diagnostics(w)))
    expect(report.applied).toHaveLength(4)
    expect(w.read('netherite/tasks/TASK-00001-core.md')).toContain('aliases: [other, TASK-00001]')
    expect(w.read('netherite/docs/notes.md')).toBeUndefined()
    expect(w.read('netherite/docs/DOC-00005-notes.md')).toContain('id: DOC-00005')
    const misc = w.read('netherite/docs/DOC-00006-misc.md') ?? ''
    expect(misc).toContain('aliases: [DOC-00006]')
    expect(w.read('netherite/docs/DOC-00007-links.md')).toContain('See [[DOC-00005-notes]].')
    expect(diagnostics(w).filter((d) => d.fix || d.severity === 'error')).toEqual([])
  })

  test('the dry run shows exactly what the real run does', async () => {
    const plan = await world(broken())
    const real = await world(broken())
    const dry = await plan.run(applyFixes(plan.repo, diagnostics(plan), { dryRun: true }))
    await real.run(applyFixes(real.repo, diagnostics(real)))
    for (const change of dry.changes) {
      expect(real.read(change.path), change.path).toBe(change.after ?? undefined)
    }
  })

  test('running it again finds nothing to do', async () => {
    const w = await world(broken())
    await w.run(applyFixes(w.repo, diagnostics(w)))
    const second = await w.run(applyFixes(w.repo, diagnostics(w)))
    expect(second).toEqual({ applied: [], skipped: [], changes: [] })
  })

  test('a fix that no longer applies is skipped, not fatal', async () => {
    const w = await world(broken())
    const found = diagnostics(w)
    await w.run(renameFile(w.repo, 'netherite/docs/notes.md', 'netherite/docs/elsewhere.md'))
    const report = await w.run(applyFixes(w.repo, found))
    expect(report.skipped.map((s) => s.fix.kind)).toContain('rename-file')
    expect(report.applied.length).toBeGreaterThan(0)
  })

  test('diagnostics without fixes are ignored', async () => {
    const w = await world()
    expect(await w.run(applyFixes(w.repo, diagnostics(w)))).toEqual({
      applied: [],
      skipped: [],
      changes: [],
    })
  })
})
