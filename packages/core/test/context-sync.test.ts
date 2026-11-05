import { describe, expect, it } from 'vitest'
import {
  applyBlock,
  BadMarkers,
  endMarker,
  startMarker,
  syncContext,
  toScannedItem,
} from '../src/index'
import { cleanFiles, type World, world } from './ops-helpers'

/** Changes a file behind the repo's back, then tells the index, as the watcher would. */
const edit = (w: World, path: string, change: (text: string) => string) => {
  const next = change(w.read(path) as string)
  w.write(path, next)
  w.repo.index.upsert(toScannedItem(path, next))
}

const ctx = (n: number, title: string, body: string, extra: string[] = []) => ({
  [`/repo/netherite/context/CTX-0000${n}-${title.toLowerCase().replace(/\W+/g, '-')}.md`]: [
    '---',
    `id: CTX-0000${n}`,
    `aliases: [CTX-0000${n}]`,
    'type: context',
    `title: ${title}`,
    'include_in_context: true',
    ...extra,
    '---',
    '',
    `# ${title}`,
    '',
    body,
    '',
  ].join('\n'),
})

const withContext = (extra: Record<string, string> = {}) => ({
  ...cleanFiles(),
  ...ctx(1, 'Conventions', 'Use tabs.', ['priority: high']),
  ...ctx(2, 'Glossary', 'A term list.'),
  ...extra,
})

describe('applyBlock', () => {
  const text = '## One\n\nBody\n'

  it('creates a file holding only the block', () => {
    const out = applyBlock('CLAUDE.md', null, text)
    expect(out?.startsWith(startMarker)).toBe(true)
    expect(out?.endsWith(`${endMarker}\n`)).toBe(true)
    expect(out).toContain('## One')
  })

  it('creates nothing when there is nothing to say', () => {
    expect(applyBlock('CLAUDE.md', null, '')).toBeNull()
  })

  it('appends after existing text, separated by a blank line', () => {
    const out = applyBlock('CLAUDE.md', '# Mine\n\nRules.\n', text) as string
    expect(out.startsWith('# Mine\n\nRules.\n\n<!-- netherite:context:start -->')).toBe(true)
    expect(out.endsWith(`${endMarker}\n`)).toBe(true)
  })

  it('leaves a file alone when there is no block and nothing to say', () => {
    expect(applyBlock('CLAUDE.md', '# Mine\n', '')).toBe('# Mine\n')
  })

  it('replaces only what is between the markers, byte for byte outside', () => {
    const first = applyBlock('CLAUDE.md', '# Mine\n  odd   spacing \n', text) as string
    const wrapped = `top  \n\n${first}\n\nbottom\t\n`
    const out = applyBlock('CLAUDE.md', wrapped, '## Two\n') as string
    expect(out.startsWith('top  \n\n')).toBe(true)
    expect(out.endsWith('\n\nbottom\t\n')).toBe(true)
    expect(out).toContain('## Two')
    expect(out).not.toContain('## One')
  })

  it('is idempotent', () => {
    const once = applyBlock('CLAUDE.md', '# Mine\n', text) as string
    expect(applyBlock('CLAUDE.md', once, text)).toBe(once)
  })

  it('keeps blank lines inside the content', () => {
    const out = applyBlock('CLAUDE.md', null, '```\na\n\n\n\nb\n```\n') as string
    expect(out).toContain('a\n\n\n\nb')
  })

  it('writes the file with its own line endings', () => {
    const out = applyBlock('CLAUDE.md', '# Mine\r\n\r\ntext\r\n', text) as string
    expect(out.replace(/\r\n/g, '')).not.toContain('\n')
    const again = applyBlock('CLAUDE.md', out, text)
    expect(again).toBe(out)
  })

  it.each([
    ['unclosed', `${startMarker}\nx\n`],
    ['unopened', `x\n${endMarker}\n`],
    ['out-of-order', `${endMarker}\n${startMarker}\n`],
    ['repeated', `${startMarker}\n${endMarker}\n${startMarker}\n${endMarker}\n`],
  ] as const)('refuses damaged markers (%s)', (problem, file) => {
    expect(() => applyBlock('CLAUDE.md', file, text)).toThrow(BadMarkers)
    try {
      applyBlock('CLAUDE.md', file, text)
    } catch (e) {
      expect((e as BadMarkers).problem).toBe(problem)
    }
  })
})

describe('syncContext', () => {
  it('writes CLAUDE.md and AGENTS.md, highest priority first', async () => {
    const w = await world(withContext())
    const report = await w.run(syncContext(w.repo))
    expect(report.targets.map((t) => [t.path, t.status])).toEqual([
      ['CLAUDE.md', 'created'],
      ['AGENTS.md', 'created'],
    ])
    const claude = w.read('CLAUDE.md') as string
    expect(claude.indexOf('Conventions')).toBeLessThan(claude.indexOf('Glossary'))
    expect(claude).toContain('Use tabs.')
    expect(w.read('AGENTS.md')).toBe(claude)
    expect(report.stale).toBe(true)
    expect(report.targets[0]?.tokens).toBeGreaterThan(0)
  })

  it('is unchanged the second time', async () => {
    const w = await world(withContext())
    await w.run(syncContext(w.repo))
    const before = w.files()
    const again = await w.run(syncContext(w.repo))
    expect(again.targets.map((t) => t.status)).toEqual(['unchanged', 'unchanged'])
    expect(again.stale).toBe(false)
    expect(w.files()).toEqual(before)
  })

  it('keeps text outside the markers when it updates', async () => {
    const w = await world({ ...withContext(), '/repo/CLAUDE.md': '# Project\n\nMy rules.\n' })
    await w.run(syncContext(w.repo))
    const first = w.read('CLAUDE.md') as string
    expect(first.startsWith('# Project\n\nMy rules.\n\n')).toBe(true)
    w.write('CLAUDE.md', `${first}\nFooter\n`)
    edit(w, 'netherite/context/CTX-00002-glossary.md', (t) =>
      t.replace('A term list.', 'New text.'),
    )
    const report = await w.run(syncContext(w.repo, { targets: ['claude'] }))
    expect(report.targets[0]?.status).toBe('updated')
    const second = w.read('CLAUDE.md') as string
    expect(second.startsWith('# Project\n\nMy rules.\n\n')).toBe(true)
    expect(second.endsWith('\nFooter\n')).toBe(true)
    expect(second).toContain('New text.')
    expect(second).not.toContain('A term list.')
  })

  it('check reports stale files and writes nothing', async () => {
    const w = await world(withContext())
    const before = w.files()
    const report = await w.run(syncContext(w.repo, { check: true }))
    expect(report.stale).toBe(true)
    expect(report.targets.every((t) => t.stale)).toBe(true)
    expect(w.files()).toEqual(before)

    await w.run(syncContext(w.repo))
    const after = await w.run(syncContext(w.repo, { check: true }))
    expect(after.stale).toBe(false)
  })

  it('check sees a hand edit inside the block', async () => {
    const w = await world(withContext())
    await w.run(syncContext(w.repo))
    w.write('CLAUDE.md', (w.read('CLAUDE.md') as string).replace('Use tabs.', 'Use spaces.'))
    const report = await w.run(syncContext(w.repo, { check: true }))
    expect(report.targets.map((t) => [t.path, t.stale])).toEqual([
      ['CLAUDE.md', true],
      ['AGENTS.md', false],
    ])
  })

  it('gives each target only the items meant for it', async () => {
    const w = await world(withContext(ctx(3, 'Claude only', 'Secret.', ['targets: [claude]'])))
    await w.run(syncContext(w.repo))
    expect(w.read('CLAUDE.md')).toContain('Secret.')
    expect(w.read('AGENTS.md')).not.toContain('Secret.')
  })

  it('lists what does not fit the budget and leaves it out', async () => {
    const w = await world(withContext(ctx(3, 'Huge', 'x'.repeat(4000), ['priority: low'])))
    const report = await w.run(syncContext(w.repo, { budget: 100 }))
    const claude = report.targets[0]
    expect(claude?.omitted.map((o) => o.id)).toContain('CTX-00003')
    expect(claude?.tokens).toBeLessThanOrEqual(100)
    expect(w.read('CLAUDE.md')).not.toContain('xxxx')
  })

  it('uses the budget and targets from the config', async () => {
    const w = await world({
      ...withContext(),
      '/repo/.netherite/config.yml': 'version: 1\ncontext:\n  budget: 500\n  targets: [agents]\n',
    })
    const report = await w.run(syncContext(w.repo))
    expect(report.targets.map((t) => [t.path, t.budget])).toEqual([['AGENTS.md', 500]])
    expect(w.read('CLAUDE.md')).toBeUndefined()
  })

  it('does nothing for the mcp target, which has no file', async () => {
    const w = await world({
      ...withContext(),
      '/repo/.netherite/config.yml': 'version: 1\ncontext:\n  targets: [mcp]\n',
    })
    const report = await w.run(syncContext(w.repo))
    expect(report.targets).toEqual([])
    expect(report.stale).toBe(false)
  })

  it('does not index the instruction files as items', async () => {
    const w = await world(withContext())
    const size = w.repo.index.size()
    await w.run(syncContext(w.repo))
    expect(w.repo.index.size()).toBe(size)
  })

  it('refuses damaged markers and changes nothing', async () => {
    const w = await world({ ...withContext(), '/repo/CLAUDE.md': `${startMarker}\nold\n` })
    const error = await w.fail(syncContext(w.repo))
    expect(error).toBeInstanceOf(BadMarkers)
    expect(w.read('CLAUDE.md')).toBe(`${startMarker}\nold\n`)
    expect(w.read('AGENTS.md')).toBeUndefined()
  })

  it('writes an empty block when the last item is switched off', async () => {
    const w = await world(withContext())
    await w.run(syncContext(w.repo))
    const files = w.files()
    for (const path of Object.keys(files).filter((p) => p.includes('/context/'))) {
      edit(w, path.replace('/repo/', ''), (t) =>
        t.replace('include_in_context: true', 'include_in_context: false'),
      )
    }
    const report = await w.run(syncContext(w.repo))
    expect(report.targets[0]?.included).toEqual([])
    const claude = w.read('CLAUDE.md') as string
    expect(claude).not.toContain('Use tabs.')
    expect(claude).toContain(startMarker)
  })

  it('reports a failed write as an IoError and leaves no temp file', async () => {
    const w = await world(withContext(), {
      failWhen: (method, path) =>
        method === 'rename' && path.includes('CLAUDE.md') ? 'disk full' : undefined,
    })
    const error = await w.fail(syncContext(w.repo))
    expect(error).toMatchObject({ _tag: 'IoError', operation: 'replace' })
    expect(w.read('CLAUDE.md')).toBeUndefined()
    expect(Object.keys(w.files()).filter((f) => f.endsWith('.tmp'))).toEqual([])
  })
})
