import { describe, expect, test } from 'vitest'
import { importBatch, splitSource } from '../src/index'
import { world } from './ops-helpers'

const setup = `---
title: Old title in frontmatter
---

# Setting up the machine

Install the tools.

## Steps

1. Run the script.
`

const entry = (extra: Record<string, unknown> = {}) => ({
  source: 'docs/old/setup.md',
  type: 'doc',
  ...extra,
})

const prepared = async () => {
  const w = await world()
  w.write('docs/old/setup.md', setup)
  w.write('docs/old/deploy.md', '# Deploy\n\nPush to main.\n')
  w.write('docs/old/notes_on-things.md', 'Plain text, no heading.\n')
  return w
}

describe('splitSource', () => {
  test('drops the frontmatter and takes the first heading as the title', () => {
    expect(splitSource(setup)).toEqual({
      title: 'Setting up the machine',
      body: 'Install the tools.\n\n## Steps\n\n1. Run the script.',
    })
    expect(splitSource('No heading here.\n')).toEqual({ body: 'No heading here.' })
  })
})

describe('importBatch', () => {
  test('copy: writes the item with its source and day, keeps the text, leaves the original', async () => {
    const w = await prepared()
    const report = await w.run(importBatch(w.repo, [entry({ fields: { covers: ['scripts/**'] } })]))
    expect(report.counts).toEqual({ created: 1, updated: 0, skipped: 0, failed: 0 })
    const [made] = report.results
    expect(made).toMatchObject({ status: 'created', id: 'DOC-00002', source: 'docs/old/setup.md' })
    const text = w.read(made?.path as string) as string
    expect(text).toContain('title: Setting up the machine')
    expect(text).toContain('source: docs/old/setup.md')
    expect(text).toContain('imported_at: 2026-03-05')
    expect(text).toContain('covers: [scripts/**]')
    expect(text).toContain('# Setting up the machine\n\nInstall the tools.\n\n## Steps')
    expect(text).not.toContain('Old title in frontmatter')
    expect(w.read('docs/old/setup.md')).toBe(setup)
  })

  test("the title is the entry's, else the heading, else the file name", async () => {
    const w = await prepared()
    const report = await w.run(
      importBatch(w.repo, [
        entry({ title: 'Machine setup' }),
        { source: 'docs/old/deploy.md', type: 'runbook' },
        { source: 'docs/old/notes_on-things.md', type: 'doc' },
      ]),
    )
    expect(report.results.map((r) => r.status)).toEqual(['created', 'created', 'created'])
    const titles = report.results.map(
      (r) => /^title: (.*)$/m.exec(w.read(r.path as string) ?? '')?.[1],
    )
    expect(titles).toEqual(['Machine setup', 'Deploy', 'Notes on things'])
  })

  test('an explicit ID is kept, with the fields the person chose', async () => {
    const w = await prepared()
    const report = await w.run(
      importBatch(w.repo, [
        {
          source: 'docs/old/deploy.md',
          type: 'adr',
          id: 'ADR-00040',
          fields: { status: 'accepted', date: '2019-04-02' },
        },
      ]),
    )
    expect(report.results[0]).toMatchObject({ status: 'created', id: 'ADR-00040' })
    const text = w.read(report.results[0]?.path as string) as string
    expect(text).toContain('status: accepted')
    expect(text).toContain('date: 2019-04-02')
  })

  test('move removes the original once the item is written; --stub leaves a note', async () => {
    const w = await prepared()
    const report = await w.run(
      importBatch(w.repo, [
        entry({ mode: 'move' }),
        { source: 'docs/old/deploy.md', type: 'runbook', mode: 'move' },
      ]),
    )
    expect(report.results.map((r) => r.original)).toEqual(['removed', 'removed'])
    expect(w.read('docs/old/setup.md')).toBeUndefined()

    const s = await prepared()
    const stubbed = await s.run(importBatch(s.repo, [entry({ mode: 'move' })], { stub: true }))
    expect(stubbed.results[0]?.original).toBe('stub')
    expect(s.read('docs/old/setup.md')).toBe(`Moved to ${stubbed.results[0]?.path} (DOC-00002).\n`)
  })

  test('the batch default mode applies to entries that do not say', async () => {
    const w = await prepared()
    await w.run(importBatch(w.repo, [entry()], { mode: 'move' }))
    expect(w.read('docs/old/setup.md')).toBeUndefined()
  })

  test('a second run skips what is already imported and changes nothing', async () => {
    const w = await prepared()
    await w.run(importBatch(w.repo, [entry()]))
    const before = w.files()
    const again = await w.run(importBatch(w.repo, [entry({ source: './docs/old/setup.md' })]))
    expect(again.counts).toEqual({ created: 0, updated: 0, skipped: 1, failed: 0 })
    expect(again.results[0]?.reason).toContain('Already imported as DOC-00002')
    expect(w.files()).toEqual(before)
  })

  test('--update brings an item up to date with its source, and skips one that already is', async () => {
    const w = await prepared()
    await w.run(importBatch(w.repo, [entry()]))
    w.write('docs/old/setup.md', setup.replace('Run the script.', 'Run the new script.'))
    const updated = await w.run(importBatch(w.repo, [entry()], { update: true }))
    expect(updated.counts).toEqual({ created: 0, updated: 1, skipped: 0, failed: 0 })
    const text = w.read(updated.results[0]?.path as string) as string
    expect(text).toContain('Run the new script.')
    expect(text).not.toContain('Run the script.')
    expect(text).toContain('imported_at: 2026-03-05')

    const settled = await w.run(importBatch(w.repo, [entry()], { update: true }))
    expect(settled.results[0]).toMatchObject({ status: 'skipped', reason: 'Already up to date' })
  })

  test('an ID in use is reported and left for the person, and the other entries still go in', async () => {
    const w = await prepared()
    const before = w.files()
    const report = await w.run(
      importBatch(w.repo, [
        { source: 'docs/old/deploy.md', type: 'adr', id: 'ADR-00001' },
        entry(),
      ]),
    )
    expect(report.counts).toEqual({ created: 1, updated: 0, skipped: 0, failed: 1 })
    expect(report.results[0]).toMatchObject({ status: 'failed', source: 'docs/old/deploy.md' })
    expect(report.results[0]?.reason).toContain('ADR-00001 is already in use')
    expect(report.results[1]?.status).toBe('created')
    expect(Object.keys(w.files()).length).toBe(Object.keys(before).length + 1)
  })

  test('bad entries fail one by one, with the reason', async () => {
    const w = await prepared()
    const report = await w.run(
      importBatch(w.repo, [
        { source: 'docs/old/setup.md', type: 'task' },
        { type: 'doc' },
        'not an entry',
        { source: '../elsewhere/x.md', type: 'doc' },
        { source: '/etc/hosts', type: 'doc' },
        { source: 'docs/missing.md', type: 'doc' },
        { source: 'https://wiki.example.com/page', type: 'doc' },
        { source: 'https://wiki.example.com/page', type: 'doc', body: 'Text.', mode: 'move' },
        { source: 'docs/old/setup.md', type: 'doc', fields: { id: 'DOC-00009' } },
        { source: 'docs/old/setup.md', type: 'doc', mode: 'delete' },
      ]),
    )
    expect(report.results.map((r) => r.status)).toEqual(Array(10).fill('failed'))
    expect(report.results.map((r) => r.reason)).toEqual([
      expect.stringContaining('`type` is one of doc, runbook, context, adr'),
      expect.stringContaining('`source` is a path'),
      expect.stringContaining('An entry is an object'),
      expect.stringContaining('without `..`'),
      expect.stringContaining('without `..`'),
      expect.stringContaining('Cannot read docs/missing.md'),
      expect.stringContaining('A URL needs a `body`'),
      expect.stringContaining('A URL cannot be moved'),
      expect.stringContaining('set by the import itself'),
      expect.stringContaining('`mode` is copy or move'),
    ])
    expect(report.results.map((r) => r.entry)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  test('a field the schema refuses is reported with its path, and nothing is written for it', async () => {
    const w = await prepared()
    const before = w.files()
    const report = await w.run(
      importBatch(w.repo, [entry({ fields: { reviewed_at: 'last week' } })]),
    )
    expect(report.results[0]).toMatchObject({
      status: 'failed',
      issues: [{ path: ['reviewed_at'] }],
    })
    expect(w.files()).toEqual(before)
  })

  test('a URL is recorded as the source when the entry brings the text', async () => {
    const w = await prepared()
    const report = await w.run(
      importBatch(w.repo, [
        {
          source: 'https://wiki.example.com/page',
          type: 'doc',
          title: 'From the wiki',
          body: '# Ignored\n\nCopied by hand.',
        },
      ]),
    )
    expect(report.results[0]?.status).toBe('created')
    const text = w.read(report.results[0]?.path as string) as string
    expect(text).toContain('source: https://wiki.example.com/page')
    expect(text).toContain('# From the wiki\n\nCopied by hand.')
  })

  test('a dry run says what would happen and writes nothing', async () => {
    const w = await prepared()
    const before = w.files()
    const report = await w.run(
      importBatch(
        w.repo,
        [entry({ mode: 'move' }), { source: 'docs/old/deploy.md', type: 'adr', id: 'ADR-00001' }],
        { dryRun: true },
      ),
    )
    expect(report.dryRun).toBe(true)
    expect(report.counts).toEqual({ created: 1, updated: 0, skipped: 0, failed: 1 })
    expect(w.files()).toEqual(before)
  })
})
