import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'
import { cli, git, isolateGit, json } from './helpers'

beforeAll(isolateGit)

const temp = async <A>(use: (dir: string) => Promise<A>) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-ctx-')))
  try {
    return await use(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const read = (dir: string, path: string) => readFileSync(join(dir, path), 'utf8')

const setup = async (dir: string) => {
  git(dir, 'init', '-q', '-b', 'main')
  await cli(dir, 'init')
  await cli(
    dir,
    'new',
    'context',
    'Conventions',
    '--set',
    'include_in_context=true',
    '--set',
    'priority=high',
    '--body',
    'Use tabs.',
    '--created-by',
    '@ada',
  )
  await cli(
    dir,
    'new',
    'context',
    'Glossary',
    '--set',
    'include_in_context=true',
    '--body',
    'A term list.',
    '--created-by',
    '@ada',
  )
}

describe('context sync', () => {
  test('writes CLAUDE.md and AGENTS.md and reports the token counts', async () => {
    await temp(async (dir) => {
      await setup(dir)
      const result = await cli(dir, 'context', 'sync')
      expect(result.code).toBe(0)
      expect(result.stdout[0]).toMatch(/^CLAUDE\.md\s+created\s+≈\d+ of 8,000 tokens, 2 items$/)
      // init already put its section in AGENTS.md, so sync adds to the file.
      expect(result.stdout[1]).toMatch(/^AGENTS\.md\s+updated/)
      expect(read(dir, 'CLAUDE.md')).toContain('Use tabs.')
      expect(read(dir, 'AGENTS.md')).toContain('A term list.')
    })
  })

  test('--check exits 1 until the files are synced, and writes nothing', async () => {
    await temp(async (dir) => {
      await setup(dir)
      const stale = await cli(dir, 'context', 'sync', '--check')
      expect(stale.code).toBe(1)
      expect(stale.stdout[0]).toContain('out of date')
      expect(stale.stderr.join('\n')).toContain('netherite context sync')
      expect(() => read(dir, 'CLAUDE.md')).toThrow()

      await cli(dir, 'context', 'sync')
      const fresh = await cli(dir, 'context', 'sync', '--check')
      expect(fresh.code).toBe(0)
      expect(fresh.stdout[0]).toContain('up to date')

      // A new context item makes the files stale again.
      await cli(dir, 'new', 'context', 'More', '--set', 'include_in_context=true')
      expect((await cli(dir, 'context', 'sync', '--check')).code).toBe(1)
    })
  })

  test('keeps the text around the block', async () => {
    await temp(async (dir) => {
      await setup(dir)
      writeFileSync(join(dir, 'CLAUDE.md'), '# Mine\n\nHand written.\n')
      await cli(dir, 'context', 'sync')
      const text = read(dir, 'CLAUDE.md')
      expect(text.startsWith('# Mine\n\nHand written.\n')).toBe(true)
      expect(text).toContain('Use tabs.')
    })
  })

  test('warns about items that do not fit, without failing', async () => {
    await temp(async (dir) => {
      await setup(dir)
      writeFileSync(
        join(dir, '.netherite/config.yml'),
        'version: 1\ncontext:\n  budget: 20\n  targets: [claude]\n',
      )
      await cli(
        dir,
        'new',
        'context',
        'Huge',
        '--set',
        'include_in_context=true',
        '--set',
        'priority=low',
        '--body',
        'x'.repeat(2000),
      )
      const result = await cli(dir, 'context', 'sync')
      expect(result.code).toBe(0)
      const warning = result.stderr.join('\n')
      expect(warning).toContain('CLAUDE.md:')
      expect(warning).toContain('not fit in the 20-token budget')
      expect(warning).toContain('Huge')
      expect(read(dir, 'CLAUDE.md')).not.toContain('xxxx')
    })
  })

  test('--json prints the report', async () => {
    await temp(async (dir) => {
      await setup(dir)
      const report = json<{ stale: boolean; targets: Array<{ path: string; status: string }> }>(
        await cli(dir, 'context', 'sync', '--json'),
      )
      expect(report.targets.map((t) => [t.path, t.status])).toEqual([
        ['CLAUDE.md', 'created'],
        ['AGENTS.md', 'updated'],
      ])
    })
  })

  test('refuses damaged markers, exit 1, and leaves the file alone', async () => {
    await temp(async (dir) => {
      await setup(dir)
      const bad = '<!-- netherite:context:start -->\nhalf\n'
      writeFileSync(join(dir, 'CLAUDE.md'), bad)
      const result = await cli(dir, 'context', 'sync')
      expect(result.code).toBe(1)
      expect(result.stderr.join('\n')).toContain('start marker with no end marker')
      expect(read(dir, 'CLAUDE.md')).toBe(bad)
    })
  })

  test('exits 2 outside a workspace', async () => {
    await temp(async (dir) => {
      expect((await cli(dir, 'context', 'sync')).code).toBe(2)
    })
  })
})
