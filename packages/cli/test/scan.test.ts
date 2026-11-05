import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'
import { cli, git, isolateGit, json } from './helpers'

beforeAll(isolateGit)

const sources: Record<string, string> = {
  'README.md': '# Shop\n\nA shop.\n',
  'CHANGELOG.md': '# Changes\n',
  'CLAUDE.md': '# Rules\n\n- Use pnpm.\n',
  'docs/setup.md': '# Setup\n\nRun it.\n',
  'docs/runbooks/deploy.md': '# Deploy\n\n1. Push.\n',
  'docs/adr/0001-use-jest.md':
    '# 1. Use Jest\n\n- **Status:** Accepted\n- **Date:** 2023-02-10\n\n## Context\n\nTests.\n',
  'docs/adr/0002-use-vitest.md':
    '# 2. Use Vitest\n\n## Status\n\nProposed\n\n## Context\n\nFast.\n',
  'apps/web/src/deep/AGENTS.md': '# Deep\n\n- Local.\n',
  'node_modules/x/README.md': '# x\n',
}

const temp = async <A>(use: (dir: string) => Promise<A>) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-scan-')))
  try {
    git(dir, 'init', '-q', '-b', 'main')
    for (const [name, content] of Object.entries(sources)) {
      mkdirSync(dirname(join(dir, name)), { recursive: true })
      writeFileSync(join(dir, name), content)
    }
    await cli(dir, 'init', '--no-skills')
    return await use(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const read = (dir: string, path: string) => readFileSync(join(dir, path), 'utf8')

interface Batch {
  mode: string
  entries: Array<{ source: string; type: string; id?: string; fields?: Record<string, string> }>
}

describe('scan', () => {
  test('writes a draft batch, says what it found and what it left out, and what to do next', async () => {
    await temp(async (dir) => {
      const result = await cli(dir, 'scan')
      expect(result.code).toBe(0)
      const text = result.stdout.join('\n')
      expect(text).toContain(
        'found 6 to bring in: 2 decision records, 2 docs, 1 runbooks, 1 agent and convention files',
      )
      expect(text).toContain('per-folder agent files')
      expect(text).toContain('apps/web/src/deep/AGENTS.md')
      expect(text).toContain('Add --nested-agent-files to include them.')
      expect(text).toContain('changelogs, licences and similar')
      expect(text).toContain('netherite import .netherite/local/scan.json --dry-run')
      const batch = JSON.parse(read(dir, '.netherite/local/scan.json')) as Batch
      expect(batch.mode).toBe('copy')
      expect(batch.entries.map((e) => `${e.type} ${e.source}`)).toEqual([
        'adr docs/adr/0001-use-jest.md',
        'adr docs/adr/0002-use-vitest.md',
        'doc README.md',
        'doc docs/setup.md',
        'runbook docs/runbooks/deploy.md',
        'context CLAUDE.md',
      ])
      expect(batch.entries[0]).toEqual({
        source: 'docs/adr/0001-use-jest.md',
        type: 'adr',
        id: 'ADR-00001',
        fields: { status: 'accepted', date: '2023-02-10' },
      })
      expect(batch.entries[1]?.fields?.status).toBe('proposed')
    })
  })

  test('the draft goes straight into import: a dry run, then the real thing, then lint', async () => {
    await temp(async (dir) => {
      await cli(dir, 'scan')
      const dry = await cli(dir, 'import', '.netherite/local/scan.json', '--dry-run')
      expect(dry.code).toBe(0)
      expect(dry.stdout).toContain('6 to create, 0 skipped, 0 failed')
      const real = await cli(dir, 'import', '.netherite/local/scan.json')
      expect(real.code).toBe(0)
      expect(real.stdout).toContain('6 created, 0 skipped, 0 failed')
      expect(existsSync(join(dir, 'netherite/adr/ADR-00001-use-jest.md'))).toBe(true)
      expect((await cli(dir, 'lint', '--fail-on', 'warning')).code).toBe(0)
      // What came in is no longer a candidate.
      const again = await cli(dir, 'scan', '--out', 'second.json')
      expect(again.stdout.join('\n')).toContain('already imported')
      expect(again.stdout.join('\n')).toContain('found nothing to bring in')
    })
  })

  test('only reads: no document is touched, and the draft is the one new file', async () => {
    await temp(async (dir) => {
      const before = Object.fromEntries(Object.keys(sources).map((f) => [f, read(dir, f)]))
      const tree = (d: string): string[] =>
        readdirSync(d, { recursive: true })
          .map(String)
          .filter((f) => !f.startsWith('.git') && statSync(join(d, f)).isFile())
          .sort()
      const listed = tree(dir)
      await cli(dir, 'scan')
      for (const [f, content] of Object.entries(before)) expect(read(dir, f), f).toBe(content)
      expect(tree(dir).filter((f) => !listed.includes(f))).toEqual(['.netherite/local/scan.json'])
    })
  })

  test('a decision record that gives no date gets the date of its first commit', async () => {
    await temp(async (dir) => {
      git(dir, 'add', 'docs/adr/0002-use-vitest.md')
      git(
        dir,
        '-c',
        'user.name=Ada',
        '-c',
        'user.email=ada@example.com',
        'commit',
        '-q',
        '-m',
        'add adr',
        '--date=2024-05-06T10:00:00Z',
      )
      await cli(dir, 'scan')
      const batch = JSON.parse(read(dir, '.netherite/local/scan.json')) as Batch
      expect(batch.entries.find((e) => e.source.endsWith('0002-use-vitest.md'))?.fields).toEqual({
        status: 'proposed',
        date: '2024-05-06',
      })
    })
  })

  test('--nested-agent-files brings in the files deep in the tree', async () => {
    await temp(async (dir) => {
      await cli(dir, 'scan', '--nested-agent-files')
      const batch = JSON.parse(read(dir, '.netherite/local/scan.json')) as Batch
      expect(batch.entries.map((e) => e.source)).toContain('apps/web/src/deep/AGENTS.md')
    })
  })

  test('will not replace an earlier draft unless told to, and --out says where', async () => {
    await temp(async (dir) => {
      await cli(dir, 'scan')
      writeFileSync(join(dir, '.netherite/local/scan.json'), '{"mine": true}\n')
      const refused = await cli(dir, 'scan')
      expect(refused.code).toBe(2)
      expect(refused.stderr.join('\n')).toContain('already exists')
      expect(read(dir, '.netherite/local/scan.json')).toBe('{"mine": true}\n')
      expect((await cli(dir, 'scan', '--out', 'elsewhere/draft.json')).code).toBe(0)
      expect(existsSync(join(dir, 'elsewhere/draft.json'))).toBe(true)
      expect((await cli(dir, 'scan', '--force')).code).toBe(0)
      expect(JSON.parse(read(dir, '.netherite/local/scan.json')).entries).toHaveLength(6)
    })
  })

  test('--json prints the batch and what was left out, and writes nothing', async () => {
    await temp(async (dir) => {
      const result = await cli(dir, 'scan', '--json')
      expect(result.code).toBe(0)
      const data = json<{
        batch: Batch
        scanned: number
        skipped: Array<{ reason: string; count: number }>
        notes: string[]
      }>(result)
      expect(data.batch.entries).toHaveLength(6)
      expect(data.skipped.map((g) => g.reason)).toEqual(['nested-agent-file', 'not-documentation'])
      expect(existsSync(join(dir, '.netherite/local/scan.json'))).toBe(false)
    })
  })

  test('says so when there is nothing to bring in, and without a workspace is exit 2', async () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-scan-empty-')))
    try {
      expect((await cli(dir, 'scan')).code).toBe(2)
      await cli(dir, 'init', '--no-skills')
      const empty = await cli(dir, 'scan')
      expect(empty.code).toBe(0)
      expect(empty.stdout.join('\n')).toContain('found nothing to bring in')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
