import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { NodeServices } from '@effect/platform-node'
import { type GitRepository, openGit } from '@netherite/git'
import {
  basicHistory,
  type Commit,
  createGitRepo,
  emptyGitConfig,
  type GitRepo,
} from '@netherite/testing'
import { Effect } from 'effect'
import { beforeAll, describe, expect, test } from 'vitest'
import {
  compileCovers,
  computeFreshness,
  createIndex,
  type Freshness,
  lint,
  lintWorkspace,
  openWorkspace,
  scanItems,
  stateFor,
  type Thresholds,
} from '../src/index'

beforeAll(() => {
  process.env.GIT_CONFIG_GLOBAL = emptyGitConfig
  process.env.GIT_CONFIG_SYSTEM = emptyGitConfig
})

const services = NodeServices.layer
const run = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) =>
  Effect.runPromise(effect.pipe(Effect.provide(services)))

const defaults: Thresholds = { drifting: 1, stale: 10 }
const docPath = 'netherite/docs/DOC-00001-app-overview.md'
const ctxPath = 'netherite/context/CTX-00001-conventions.md'
const runPath = 'netherite/runbooks/RUN-00001-release.md'

const measure = async (
  dir: string,
  options: { thresholds?: Thresholds; git?: boolean; workspaceDir?: string; asOf?: string } = {},
) => {
  const root = options.workspaceDir ?? dir
  const workspace = await run(openWorkspace(root))
  const items = await run(scanItems(workspace))
  const index = createIndex({ config: workspace.config })
  index.build(items)
  const git: GitRepository | undefined =
    options.git === false ? undefined : await run(openGit(root))
  const freshness = await run(
    computeFreshness({
      index,
      git,
      thresholds: options.thresholds ?? workspace.config.freshness,
      root,
      ...(options.asOf === undefined ? {} : { asOf: options.asOf }),
    }),
  )
  return { freshness, index, workspace, git }
}

const withFixture = async <A>(
  use: (repo: GitRepo) => Promise<A>,
  history: ReadonlyArray<Commit> = basicHistory,
  uncommitted?: Record<string, string>,
) => {
  const repo = await createGitRepo({
    fixture: 'basic',
    history,
    ...(uncommitted ? { uncommitted } : {}),
  })
  try {
    return await use(repo)
  } finally {
    await repo.cleanup()
  }
}

const commitsOn = (count: number, path = 'src/app.ts', start = '2026-02-01'): Commit[] =>
  Array.from({ length: count }, (_, i) => ({
    message: `change ${i}`,
    date: `${start}T10:${String(i).padStart(2, '0')}:00Z`,
    write: { [path]: `export const v = ${i}\n` },
  }))

describe('compileCovers', () => {
  const test_ = (patterns: string[], path: string) => compileCovers(patterns)(path)

  test.each([
    [['src/**'], 'src/app.ts', true],
    [['src/**'], 'src/deep/er/app.ts', true],
    [['src/**'], 'lib/app.ts', false],
    [['src/*.ts'], 'src/app.ts', true],
    [['src/*.ts'], 'src/deep/app.ts', false],
    [['**/*.md'], 'docs/a/b.md', true],
    [['**/*.md'], 'README.md', true],
    [['src/{a,b}.ts'], 'src/b.ts', true],
    [['src/{a,b}.ts'], 'src/c.ts', false],
    [['src/?.ts'], 'src/a.ts', true],
    [['src/?.ts'], 'src/ab.ts', false],
    [['src/**/*.test.ts'], 'src/x/y.test.ts', true],
    [['src/**'], '.hidden/x', false],
    [['**'], '.github/ci.yml', true],
  ])('%j matches %s: %s', (patterns, path, expected) => {
    expect(test_(patterns, path)).toBe(expected)
  })

  test('a plain name covers that file or everything under that folder', () => {
    expect(test_(['src'], 'src/app.ts')).toBe(true)
    expect(test_(['src/'], 'src/deep/app.ts')).toBe(true)
    expect(test_(['./src'], 'src/app.ts')).toBe(true)
    expect(test_(['src/app.ts'], 'src/app.ts')).toBe(true)
    expect(test_(['src'], 'srcs/app.ts')).toBe(false)
    expect(test_(['src'], 'other/src/app.ts')).toBe(false)
  })

  test('a leading ! excludes', () => {
    expect(test_(['src/**', '!src/generated/**'], 'src/app.ts')).toBe(true)
    expect(test_(['src/**', '!src/generated/**'], 'src/generated/x.ts')).toBe(false)
    expect(test_(['src/**', '!**/*.test.ts'], 'src/a.test.ts')).toBe(false)
    expect(test_(['src', '!src/util.ts'], 'src/util.ts')).toBe(false)
  })

  test('only exclusions, or nothing, covers nothing', () => {
    expect(test_(['!src/**'], 'src/app.ts')).toBe(false)
    expect(test_([], 'src/app.ts')).toBe(false)
    expect(test_([' ', ''], 'src/app.ts')).toBe(false)
  })
})

describe('stateFor', () => {
  test('uses the thresholds', () => {
    expect([0, 1, 9, 10, 50].map((n) => stateFor(n, defaults))).toEqual([
      'fresh',
      'drifting',
      'drifting',
      'stale',
      'stale',
    ])
    expect([0, 1, 2, 3].map((n) => stateFor(n, { drifting: 2, stale: 3 }))).toEqual([
      'fresh',
      'fresh',
      'drifting',
      'stale',
    ])
  })
})

describe('fixtures/basic', () => {
  test('docs and context that cover src drift; the runbook is fresh', async () => {
    await withFixture(async (repo) => {
      const { freshness } = await measure(repo.root)
      expect(freshness.get(docPath)).toMatchObject({
        state: 'drifting',
        commits: 3,
        uncommitted: false,
        atLeast: false,
        baseline: { source: 'reviewed_at', date: '2026-01-10' },
        covers: ['src/**'],
      })
      expect(freshness.get(ctxPath)).toMatchObject({ state: 'drifting', commits: 3 })
      expect(freshness.get(runPath)).toMatchObject({ state: 'fresh', commits: 0 })
    })
  })

  test('items without covers, and superseded ADRs, are not tracked', async () => {
    await withFixture(async (repo) => {
      const { freshness } = await measure(repo.root)
      expect(freshness.get('netherite/docs/DOC-00002-orphan-notes.md')).toMatchObject({
        state: 'not-tracked',
        reason: 'no-covers',
      })
      expect(freshness.get('netherite/adr/ADR-00001-use-callbacks.md')).toMatchObject({
        state: 'not-tracked',
        reason: 'superseded',
      })
      expect(freshness.get('netherite/adr/ADR-00002-use-promises.md')).toMatchObject({
        state: 'not-tracked',
        reason: 'no-covers',
      })
      expect(freshness.get('netherite/tasks/TASK-00002-add-the-cli.md')?.state).toBe('not-tracked')
      expect(freshness.size).toBe(17)
    })
  })

  test('a deprecated ADR is not tracked even if it covers files', async () => {
    await withFixture(async (repo) => {
      const file = join(repo.root, 'netherite/adr/ADR-00003-proposed-logging.md')
      const text = (await import('node:fs')).readFileSync(file, 'utf8')
      writeFileSync(
        file,
        text.replace('status: proposed', 'status: deprecated\ncovers: ["src/**"]'),
      )
      const { freshness } = await measure(repo.root)
      expect(freshness.get('netherite/adr/ADR-00003-proposed-logging.md')).toMatchObject({
        state: 'not-tracked',
        reason: 'deprecated',
      })
    })
  })

  test('a deprecated doc is not tracked', async () => {
    await withFixture(async (repo) => {
      const file = join(repo.root, docPath)
      const text = (await import('node:fs')).readFileSync(file, 'utf8')
      writeFileSync(file, text.replace('type: doc', 'type: doc\nstatus: deprecated'))
      const { freshness } = await measure(repo.root)
      expect(freshness.get(docPath)).toMatchObject({
        state: 'not-tracked',
        reason: 'deprecated',
      })
    })
  })
})

describe('thresholds', () => {
  test('come from the config', async () => {
    await withFixture(async (repo) => {
      const { freshness } = await measure(repo.root, { thresholds: { drifting: 2, stale: 3 } })
      expect(freshness.get(docPath)).toMatchObject({ state: 'stale', commits: 3 })
      const lenient = await measure(repo.root, { thresholds: { drifting: 4, stale: 10 } })
      expect(lenient.freshness.get(docPath)).toMatchObject({ state: 'fresh', commits: 3 })
    })
  })

  test('ten commits make an item stale by default', async () => {
    await withFixture(
      async (repo) => {
        const { freshness } = await measure(repo.root)
        expect(freshness.get(docPath)).toMatchObject({ state: 'stale', commits: 3 + 9 })
      },
      [...basicHistory, ...commitsOn(9)],
    )
  })

  test('as of a past date, later commits do not count', async () => {
    await withFixture(
      async (repo) => {
        const now = (await measure(repo.root)).freshness.get(docPath)
        const then = (await measure(repo.root, { asOf: '2026-01-31' })).freshness.get(docPath)
        expect(now).toMatchObject({ state: 'stale', commits: 3 + 9 })
        expect(then).toMatchObject({ state: 'drifting', commits: 3 })
      },
      [...basicHistory, ...commitsOn(9)],
    )
  })

  test('nine make it drifting', async () => {
    await withFixture(
      async (repo) => {
        expect((await measure(repo.root)).freshness.get(docPath)).toMatchObject({
          state: 'drifting',
          commits: 3 + 6,
        })
      },
      [...basicHistory, ...commitsOn(6)],
    )
  })

  test('the thresholds in config.yml are used when none are given', async () => {
    await withFixture(async (repo) => {
      writeFileSync(
        join(repo.root, '.netherite/config.yml'),
        'version: 1\nfreshness:\n  drifting: 1\n  stale: 2\n',
      )
      const { freshness } = await measure(repo.root)
      expect(freshness.get(docPath)?.state).toBe('stale')
    })
  })
})

describe('baselines', () => {
  test('commits on the review day do not count; later ones do', async () => {
    await withFixture(async (repo) => {
      const set = (date: string) => {
        const file = join(repo.root, 'netherite/docs/DOC-00001-app-overview.md')
        const text = (require('node:fs') as typeof import('node:fs')).readFileSync(file, 'utf8')
        writeFileSync(file, text.replace(/reviewed_at: .*/, `reviewed_at: ${date}`))
      }
      set('2026-01-14')
      expect((await measure(repo.root)).freshness.get(docPath)).toMatchObject({ commits: 1 })
      set('2026-01-13')
      expect((await measure(repo.root)).freshness.get(docPath)).toMatchObject({ commits: 2 })
      set('2026-01-20')
      expect((await measure(repo.root)).freshness.get(docPath)).toMatchObject({
        state: 'fresh',
        commits: 0,
      })
      set('2030-01-01')
      expect((await measure(repo.root)).freshness.get(docPath)).toMatchObject({
        state: 'fresh',
        commits: 0,
      })
    })
  })

  test('without reviewed_at, counting starts after the commit that last touched the item', async () => {
    const doc = (extra = '') =>
      `---\nid: DOC-00010\naliases: [DOC-00010]\ntype: doc\ntitle: No date\ncovers: ["src/**"]\n---\n\n# No date${extra}\n`
    await withFixture(
      async (repo) => {
        const { freshness } = await measure(repo.root)
        const fresh = freshness.get('netherite/docs/DOC-00010-nodate.md')
        expect(fresh).toMatchObject({
          state: 'drifting',
          commits: 2,
          baseline: { source: 'last-commit', date: '2026-01-12' },
        })
        expect(fresh?.baseline).toHaveProperty('hash')
      },
      [
        ...basicHistory.slice(0, 1),
        {
          message: 'add doc and change src',
          date: '2026-01-12T10:00:00Z',
          write: {
            'netherite/docs/DOC-00010-nodate.md': doc(),
            'src/app.ts': 'export const x = 1\n',
          },
        },
        ...basicHistory.slice(1).filter((c) => c.date > '2026-01-12'),
      ],
    )
  })

  test('editing the doc again moves its baseline', async () => {
    const doc = (extra = '') =>
      `---\nid: DOC-00010\naliases: [DOC-00010]\ntype: doc\ntitle: No date\ncovers: ["src/**"]\n---\n\n# No date${extra}\n`
    await withFixture(
      async (repo) => {
        const { freshness } = await measure(repo.root)
        expect(freshness.get('netherite/docs/DOC-00010-nodate.md')).toMatchObject({
          state: 'fresh',
          commits: 0,
          baseline: { date: '2026-02-05' },
        })
      },
      [
        ...basicHistory,
        {
          message: 'add doc',
          date: '2026-02-01T10:00:00Z',
          write: { 'netherite/docs/DOC-00010-nodate.md': doc() },
        },
        ...commitsOn(3, 'src/app.ts', '2026-02-03'),
        {
          message: 'review doc',
          date: '2026-02-05T10:00:00Z',
          write: { 'netherite/docs/DOC-00010-nodate.md': doc('\n\nReviewed.') },
        },
      ],
    )
  })

  test('an item that was never committed and never reviewed is fresh', async () => {
    const text =
      '---\nid: DOC-00011\naliases: [DOC-00011]\ntype: doc\ntitle: Brand new\ncovers: ["src/**"]\n---\n'
    await withFixture(
      async (repo) => {
        const { freshness } = await measure(repo.root)
        expect(freshness.get('netherite/docs/DOC-00011-new.md')).toMatchObject({
          state: 'fresh',
          commits: 0,
          baseline: undefined,
        })
      },
      basicHistory,
      { 'netherite/docs/DOC-00011-new.md': text },
    )
  })
})

describe('uncommitted changes', () => {
  test('a change under a covered path counts as one more commit', async () => {
    await withFixture(
      async (repo) => {
        const { freshness } = await measure(repo.root)
        expect(freshness.get(runPath)).toMatchObject({
          state: 'drifting',
          commits: 1,
          uncommitted: true,
        })
        expect(freshness.get(docPath)).toMatchObject({ commits: 4, uncommitted: true })
      },
      basicHistory,
      { 'src/util.ts': 'export const util = () => "dirty"\n' },
    )
  })

  test('the changed files are named', async () => {
    await withFixture(
      async (repo) => {
        const { freshness } = await measure(repo.root)
        expect(freshness.get(docPath)?.uncommittedFiles).toEqual(['src/util.ts'])
      },
      basicHistory,
      { 'src/util.ts': 'export const util = () => "dirty"\n' },
    )
  })

  test('a review today covers what is uncommitted, and an older one does not', async () => {
    await withFixture(
      async (repo) => {
        const file = join(repo.root, docPath)
        const text = readFileSync(file, 'utf8')
        const today = new Date().toISOString().slice(0, 10)
        writeFileSync(file, text.replace(/reviewed_at: .*/, `reviewed_at: ${today}`))
        const { freshness } = await measure(repo.root)
        expect(freshness.get(docPath)).toMatchObject({
          state: 'fresh',
          commits: 0,
          uncommitted: false,
          uncommittedFiles: [],
        })
      },
      basicHistory,
      { 'src/util.ts': 'export const util = () => "dirty"\n' },
    )
  })

  test('so does a new untracked file', async () => {
    await withFixture(
      async (repo) => {
        const { freshness } = await measure(repo.root)
        expect(freshness.get(docPath)).toMatchObject({ commits: 4, uncommitted: true })
        expect(freshness.get(runPath)).toMatchObject({ commits: 0, uncommitted: false })
      },
      basicHistory,
      { 'src/util2.ts': 'x\n' },
    )
  })

  test('several changed files still count as one', async () => {
    await withFixture(
      async (repo) => {
        const { freshness } = await measure(repo.root)
        expect(freshness.get(docPath)).toMatchObject({ commits: 4 })
      },
      basicHistory,
      { 'src/a.ts': '1', 'src/b.ts': '2', 'src/c.ts': '3' },
    )
  })

  test('changes outside the covered paths are ignored', async () => {
    await withFixture(
      async (repo) => {
        const { freshness } = await measure(repo.root)
        expect(freshness.get(runPath)).toMatchObject({
          state: 'fresh',
          commits: 0,
          uncommitted: false,
        })
      },
      basicHistory,
      { 'src/app.ts': 'dirty app only\n', 'README.md': 'x\n' },
    )
  })

  test('editing the item itself is not drift, even if it covers its own folder', async () => {
    await withFixture(async (repo) => {
      const file = join(repo.root, 'netherite/docs/DOC-00001-app-overview.md')
      const text = (require('node:fs') as typeof import('node:fs')).readFileSync(file, 'utf8')
      writeFileSync(
        file,
        `${text.replace('covers: ["src/**"]', 'covers: ["netherite/**"]').replace(/reviewed_at: .*/, 'reviewed_at: 2026-01-01')}\nedited\n`,
      )
      const { freshness } = await measure(repo.root)
      expect(freshness.get(docPath)).toMatchObject({
        state: 'fresh',
        commits: 0,
        uncommitted: false,
      })
    })
  })
})

describe('covers patterns in practice', () => {
  test('a negated pattern leaves files out', async () => {
    await withFixture(async (repo) => {
      const file = join(repo.root, 'netherite/runbooks/RUN-00001-release.md')
      const text = (require('node:fs') as typeof import('node:fs')).readFileSync(file, 'utf8')
      writeFileSync(
        file,
        text
          .replace('covers: ["src/util.ts"]', 'covers: ["src/**", "!src/app.ts"]')
          .replace('reviewed_at: 2026-01-15', 'reviewed_at: 2026-01-10'),
      )
      const { freshness } = await measure(repo.root)
      expect(freshness.get(runPath)).toMatchObject({
        commits: 1,
        covers: ['src/**', '!src/app.ts'],
      })
    })
  })
})

describe('without usable history', () => {
  test('no git: tracked items are unknown, others stay not tracked', async () => {
    await withFixture(async (repo) => {
      const { freshness } = await measure(repo.root, { git: false })
      expect(freshness.get(docPath)).toMatchObject({ state: 'unknown', reason: 'no-git' })
      expect(freshness.get('netherite/docs/DOC-00002-orphan-notes.md')?.state).toBe('not-tracked')
    })
  })

  test('a repository with no commits has nothing to count', async () => {
    const repo = await createGitRepo({ fixture: 'basic' })
    try {
      execFileSync('git', ['update-ref', '-d', 'HEAD'], { cwd: repo.root })
      const { freshness } = await measure(repo.root)
      expect(freshness.get(docPath)).toMatchObject({ commits: 1, uncommitted: true })
    } finally {
      await repo.cleanup()
    }
  })
})

describe('shallow clones', () => {
  const shallowClone = async (repo: GitRepo, depth: number) => {
    const target = mkdtempSync(join(tmpdir(), 'netherite-shallow-'))
    execFileSync('git', ['clone', '-q', '--depth', String(depth), `file://${repo.root}`, 'clone'], {
      cwd: target,
    })
    return {
      dir: join(target, 'clone'),
      cleanup: () => rmSync(target, { recursive: true, force: true }),
    }
  }

  test('history that stops after the baseline is unknown, not wrongly fresh', async () => {
    await withFixture(async (repo) => {
      const clone = await shallowClone(repo, 2)
      try {
        const { freshness } = await measure(clone.dir)
        expect(freshness.get(docPath)).toMatchObject({
          state: 'unknown',
          reason: 'shallow',
          atLeast: true,
        })
        expect(freshness.get(docPath)?.commits).toBeGreaterThan(0)
      } finally {
        clone.cleanup()
      }
    })
  })

  test('a count that already reaches stale is stale, as a minimum', async () => {
    await withFixture(async (repo) => {
      const clone = await shallowClone(repo, 2)
      try {
        const { freshness } = await measure(clone.dir, { thresholds: { drifting: 1, stale: 2 } })
        expect(freshness.get(docPath)).toMatchObject({ state: 'stale', atLeast: true })
      } finally {
        clone.cleanup()
      }
    })
  })

  test('when the clone covers the whole range it is exact', async () => {
    await withFixture(async (repo) => {
      const clone = await shallowClone(repo, 4)
      try {
        const { freshness } = await measure(clone.dir)
        expect(freshness.get(docPath)).toMatchObject({
          state: 'drifting',
          commits: 3,
          atLeast: false,
        })
      } finally {
        clone.cleanup()
      }
    })
  })

  test('a last-commit baseline that is the cut-off commit is unknown', async () => {
    const doc =
      '---\nid: DOC-00010\naliases: [DOC-00010]\ntype: doc\ntitle: No date\ncovers: ["src/**"]\n---\n'
    await withFixture(
      async (repo) => {
        const clone = await shallowClone(repo, 1)
        try {
          const { freshness } = await measure(clone.dir)
          expect(freshness.get('netherite/docs/DOC-00010-nodate.md')).toMatchObject({
            state: 'unknown',
            reason: 'shallow',
          })
        } finally {
          clone.cleanup()
        }
      },
      [
        ...basicHistory,
        {
          message: 'doc',
          date: '2026-02-01T10:00:00Z',
          write: { 'netherite/docs/DOC-00010-nodate.md': doc },
        },
      ],
    )
  })
})

describe('a workspace inside a larger repository', () => {
  test('paths are relative to the workspace, and files outside it are ignored', async () => {
    const files = (path: string) => path
    void files
    const doc =
      '---\nid: DOC-00001\naliases: [DOC-00001]\ntype: doc\ntitle: Site docs\ncovers: ["src/**"]\nreviewed_at: 2026-01-05\n---\n'
    const repo = await createGitRepo({
      history: [
        {
          message: 'workspace',
          date: '2026-01-01T10:00:00Z',
          write: {
            'site/.netherite/config.yml': 'version: 1\n',
            'site/netherite/docs/DOC-00001-site.md': doc,
            'site/src/a.ts': '1',
            'other/src/b.ts': '1',
          },
        },
        { message: 'in site', date: '2026-01-10T10:00:00Z', write: { 'site/src/a.ts': '2' } },
        { message: 'outside', date: '2026-01-11T10:00:00Z', write: { 'other/src/b.ts': '2' } },
        { message: 'in site again', date: '2026-01-12T10:00:00Z', write: { 'site/src/c.ts': '3' } },
      ],
    })
    try {
      const site = join(repo.root, 'site')
      mkdirSync(dirname(join(site, 'x')), { recursive: true })
      const { freshness } = await measure(repo.root, { workspaceDir: site })
      expect(freshness.get('netherite/docs/DOC-00001-site.md')).toMatchObject({
        state: 'drifting',
        commits: 2,
      })
    } finally {
      await repo.cleanup()
    }
  })
})

describe('lint', () => {
  const lintWith = async (
    repo: GitRepo,
    options: Parameters<typeof measure>[1] = {},
    severity?: { drifting?: 'error' | 'warning' | 'info'; stale?: 'error' | 'warning' | 'info' },
  ) => {
    const { freshness, index, workspace } = await measure(repo.root, options)
    return lint(index, {
      config: workspace.config,
      contentRoot: 'netherite',
      freshness,
      ...(severity ? { freshnessSeverity: severity } : {}),
    }).filter((d) => d.rule === 'drifting' || d.rule === 'stale')
  }

  test('drifting items get a warning at their reviewed_at line', async () => {
    await withFixture(async (repo) => {
      const found = await lintWith(repo)
      expect(found.map((d) => [d.path, d.rule, d.severity, d.line])).toEqual([
        [ctxPath, 'drifting', 'warning', 8],
        [docPath, 'drifting', 'warning', 10],
      ])
      expect(found[1]?.message).toBe(
        'Drifting: 3 commits touched src/** since it was reviewed on 2026-01-10. Review it, then mark it reviewed.',
      )
    })
  })

  test('stale items get their own rule, and uncommitted changes are mentioned', async () => {
    await withFixture(
      async (repo) => {
        const found = await lintWith(repo, {}, undefined)
        const doc = found.find((d) => d.path === docPath)
        expect(doc).toMatchObject({ rule: 'stale' })
        expect(doc?.message).toContain('12 commits')
        expect(doc?.message).toContain('including uncommitted changes')
      },
      [...basicHistory, ...commitsOn(8)],
      { 'src/dirty.ts': 'x' },
    )
  })

  test('severity can be raised for CI', async () => {
    await withFixture(async (repo) => {
      const found = await lintWith(repo, {}, { drifting: 'error' })
      expect(found.every((d) => d.severity === 'error')).toBe(true)
    })
  })

  test('fresh, not-tracked and unknown items are not reported', async () => {
    await withFixture(async (repo) => {
      expect(await lintWith(repo, { git: false })).toEqual([])
    })
  })

  test('without freshness data the rules do not run', async () => {
    await withFixture(async (repo) => {
      const { index, workspace } = await measure(repo.root)
      const found = lint(index, { config: workspace.config, contentRoot: 'netherite' })
      expect(found.some((d) => d.rule === 'drifting' || d.rule === 'stale')).toBe(false)
    })
  })

  test('lintWorkspace checks freshness when given the repository', async () => {
    await withFixture(async (repo) => {
      const git = await run(openGit(repo.root))
      const found = await run(
        Effect.gen(function* () {
          const workspace = yield* openWorkspace(repo.root)
          return {
            with: yield* lintWorkspace(workspace, { git }),
            without: yield* lintWorkspace(workspace),
          }
        }),
      )
      const rules = (list: ReadonlyArray<{ rule: string }>) =>
        list.filter((d) => d.rule === 'drifting').length
      expect(rules(found.with)).toBe(2)
      expect(rules(found.without)).toBe(0)
    })
  })
})

test('Freshness has no stray fields', async () => {
  await withFixture(async (repo) => {
    const { freshness } = await measure(repo.root)
    const one: Freshness | undefined = freshness.get(docPath)
    expect(Object.keys(one ?? {}).sort()).toEqual([
      'atLeast',
      'baseline',
      'commits',
      'covers',
      'state',
      'uncommitted',
      'uncommittedFiles',
    ])
  })
})
