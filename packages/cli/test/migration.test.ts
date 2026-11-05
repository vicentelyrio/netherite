import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { NodeServices } from '@effect/platform-node'
import { link, openRepo } from '@netherite/core'
import { Effect } from 'effect'
import { beforeAll, describe, expect, test } from 'vitest'
import { cli, git, isolateGit, json } from './helpers'

beforeAll(isolateGit)

/**
 * The migration of ADR-00026 from the command's side: a repository that already has a README, a
 * `docs/` folder, MADR-style decision records and a `CLAUDE.md`. The batch file is what the
 * `netherite-migrate` skill writes after it has surveyed the repository and asked the person.
 */
const fixture: Record<string, string> = {
  'README.md': '# Shop\n\nA small shop. See [setup](docs/setup.md).\n',
  'src/cart/index.ts': 'export const cart = []\n',
  'src/checkout/index.ts': 'export const checkout = []\n',
  'scripts/deploy.sh': '#!/bin/sh\necho deploy\n',
  'docs/setup.md': '# Setting up\n\nRun `pnpm install`, then `pnpm dev`.\n',
  'docs/architecture.md':
    '# Architecture\n\nThe cart lives in `src/cart` and checkout in `src/checkout`. See ADR 0003.\n',
  'docs/runbooks/deploy.md': '# Deploy\n\n1. Run `scripts/deploy.sh`.\n2. Check the dashboard.\n',
  'docs/adr/0001-use-jest.md':
    '# 1. Use Jest\n\nDate: 2023-02-10\n\n## Status\n\nSuperseded by [3. Use Vitest](0003-use-vitest.md)\n\n## Context\n\nWe need tests.\n\n## Decision\n\nUse Jest.\n',
  'docs/adr/0002-use-postgres.md':
    '# 2. Use Postgres\n\nDate: 2023-03-01\n\n## Status\n\nAccepted\n\n## Context\n\nWe need a database.\n\n## Decision\n\nUse Postgres.\n',
  'docs/adr/0003-use-vitest.md':
    '# 3. Use Vitest\n\nDate: 2024-06-12\n\n## Status\n\nAccepted\n\n## Context\n\nJest was slow.\n\n## Decision\n\nUse Vitest.\n',
  'CLAUDE.md': '# Shop\n\n- Use pnpm, never npm.\n- Tests live next to the code.\n',
}

const batch = {
  mode: 'copy',
  entries: [
    { source: 'README.md', type: 'doc', title: 'Shop overview' },
    { source: 'docs/setup.md', type: 'doc' },
    {
      source: 'docs/architecture.md',
      type: 'doc',
      fields: { covers: ['src/cart/**', 'src/checkout/**'] },
    },
    {
      source: 'docs/runbooks/deploy.md',
      type: 'runbook',
      fields: { covers: ['scripts/deploy.sh'] },
    },
    {
      source: 'docs/adr/0001-use-jest.md',
      type: 'adr',
      id: 'ADR-00001',
      title: 'Use Jest',
      fields: { status: 'superseded', date: '2023-02-10' },
    },
    {
      source: 'docs/adr/0002-use-postgres.md',
      type: 'adr',
      id: 'ADR-00002',
      title: 'Use Postgres',
      fields: { status: 'accepted', date: '2023-03-01' },
    },
    {
      source: 'docs/adr/0003-use-vitest.md',
      type: 'adr',
      id: 'ADR-00003',
      title: 'Use Vitest',
      fields: { status: 'accepted', date: '2024-06-12' },
    },
    {
      source: 'CLAUDE.md',
      type: 'context',
      title: 'Conventions',
      fields: { include_in_context: true, priority: 'high' },
    },
  ],
}

const temp = async <A>(use: (dir: string) => Promise<A>) => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-migration-')))
  try {
    return await use(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const read = (dir: string, path: string) => readFileSync(join(dir, path), 'utf8')

const existing = async (dir: string) => {
  git(dir, 'init', '-q', '-b', 'main')
  for (const [name, content] of Object.entries(fixture)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true })
    writeFileSync(join(dir, name), content)
  }
  git(dir, 'add', '.')
  git(
    dir,
    '-c',
    'user.name=Ada',
    '-c',
    'user.email=ada@example.com',
    'commit',
    '-q',
    '-m',
    'before netherite',
  )
  await cli(dir, 'init')
  writeFileSync(join(dir, '.netherite/local-batch.json'), JSON.stringify(batch))
}

describe('migrating an existing repository', () => {
  test('a dry run shows the whole batch and writes nothing', async () => {
    await temp(async (dir) => {
      await existing(dir)
      const before = git(dir, 'status', '--short')
      const result = await cli(dir, 'import', '.netherite/local-batch.json', '--dry-run')
      expect(result.code).toBe(0)
      expect(result.stdout.filter((l) => l.startsWith('would create'))).toHaveLength(8)
      expect(result.stdout).toContain('8 to create, 0 skipped, 0 failed')
      expect(git(dir, 'status', '--short')).toBe(before)
    })
  })

  test('imports everything, keeps the ADR numbers, records the sources, and lints clean', async () => {
    await temp(async (dir) => {
      await existing(dir)
      const result = await cli(dir, 'import', '.netherite/local-batch.json')
      expect(result.code).toBe(0)
      expect(result.stdout).toContain('8 created, 0 skipped, 0 failed')

      expect(existsSync(join(dir, 'netherite/adr/ADR-00001-use-jest.md'))).toBe(true)
      expect(existsSync(join(dir, 'netherite/adr/ADR-00003-use-vitest.md'))).toBe(true)
      const adr = read(dir, 'netherite/adr/ADR-00003-use-vitest.md')
      expect(adr).toContain('status: accepted')
      expect(adr).toContain('date: 2024-06-12')
      expect(adr).toContain('source: docs/adr/0003-use-vitest.md')
      expect(adr).toContain('## Decision')

      const architecture = read(dir, 'netherite/docs/DOC-00003-architecture.md')
      expect(architecture).toContain('covers: [src/cart/**, src/checkout/**]')
      expect(architecture).toContain('The cart lives in `src/cart`')
      expect(read(dir, 'netherite/runbooks/RUN-00001-deploy.md')).toContain(
        'covers: [scripts/deploy.sh]',
      )

      for (const [name, content] of Object.entries(fixture)) {
        expect(read(dir, name).startsWith(content), name).toBe(true)
      }
      const conventions = read(dir, 'netherite/context/CTX-00002-conventions.md')
      expect(conventions).toContain('Use pnpm, never npm.')
      expect(conventions).not.toContain('Plan first')
      expect(git(dir, 'rev-list', '--count', 'HEAD')).toBe('1')

      expect((await cli(dir, 'lint', '--fail-on', 'warning')).code).toBe(0)
    })
  })

  test('the skill links afterwards: the newer ADR supersedes the older, both files change', async () => {
    await temp(async (dir) => {
      await existing(dir)
      await cli(dir, 'import', '.netherite/local-batch.json')
      await Effect.runPromise(
        Effect.gen(function* () {
          const repo = yield* openRepo(dir)
          yield* link(repo, { from: 'ADR-00003', to: 'ADR-00001', kind: 'supersedes' })
          yield* link(repo, { from: 'DOC-00003', to: 'ADR-00003', kind: 'explains' })
        }).pipe(Effect.provide(NodeServices.layer)),
      )
      expect(read(dir, 'netherite/adr/ADR-00003-use-vitest.md')).toContain(
        'supersedes: [ADR-00001]',
      )
      const old = read(dir, 'netherite/adr/ADR-00001-use-jest.md')
      expect(old).toContain('status: superseded')
      expect(old).toContain('superseded_by: ADR-00003')
      expect(read(dir, 'netherite/docs/DOC-00003-architecture.md')).toContain(
        'explains: [ADR-00003]',
      )
      expect((await cli(dir, 'lint', '--fail-on', 'warning')).code).toBe(0)
    })
  })

  test('running the batch again skips all of it, and a deleted source is a note, not an error', async () => {
    await temp(async (dir) => {
      await existing(dir)
      await cli(dir, 'import', '.netherite/local-batch.json')
      const before = read(dir, 'netherite/docs/DOC-00001-shop-overview.md')
      const again = await cli(dir, 'import', '.netherite/local-batch.json')
      expect(again.code).toBe(0)
      expect(again.stdout).toContain('0 created, 8 skipped, 0 failed')
      expect(read(dir, 'netherite/docs/DOC-00001-shop-overview.md')).toBe(before)

      rmSync(join(dir, 'docs/setup.md'))
      const lint = json<{ diagnostics: Array<{ rule: string; severity: string; path: string }> }>(
        await cli(dir, 'lint', '--json'),
      )
      const notes = lint.diagnostics.filter((d) => d.rule === 'source-missing')
      expect(notes).toEqual([
        expect.objectContaining({
          severity: 'info',
          path: 'netherite/docs/DOC-00002-setting-up.md',
        }),
      ])
      expect((await cli(dir, 'lint', '--fail-on', 'warning')).code).toBe(0)
    })
  })

  test('CLAUDE.md as context: sync writes it back into the same file, so it says it twice', async () => {
    await temp(async (dir) => {
      await existing(dir)
      await cli(dir, 'import', '.netherite/local-batch.json')
      const sync = await cli(dir, 'context', 'sync')
      expect(sync.code).toBe(0)
      const claude = read(dir, 'CLAUDE.md')
      expect(claude.match(/Use pnpm, never npm\./g)).toHaveLength(2)
      expect(claude).toContain('<!-- netherite:context:start -->')
      expect(claude).toContain('## How agents work in this repository')
    })
  })

  test('a clash on a kept ADR number is reported and nothing is renumbered', async () => {
    await temp(async (dir) => {
      await existing(dir)
      await cli(dir, 'new', 'adr', 'Already here', '--set', 'date=2024-01-01')
      const result = await cli(dir, 'import', '.netherite/local-batch.json')
      expect(result.code).toBe(1)
      const failed = result.stdout.filter((l) => l.startsWith('failed'))
      expect(failed).toHaveLength(1)
      expect(failed[0]).toContain('docs/adr/0001-use-jest.md')
      expect(failed[0]).toContain('ADR-00001 is already in use')
      expect(result.stdout).toContain('7 created, 0 skipped, 1 failed')
    })
  })
})
