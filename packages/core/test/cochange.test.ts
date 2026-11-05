import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
import { type CoChange, type CoChangeOptions, coChanged, suggestCovers } from '../src/index'

beforeAll(() => {
  process.env.GIT_CONFIG_GLOBAL = emptyGitConfig
  process.env.GIT_CONFIG_SYSTEM = emptyGitConfig
})

const run = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) =>
  Effect.runPromise(effect.pipe(Effect.provide(NodeServices.layer)))

const guide = 'docs/guide.md'

/** A guide that changes with src/a.ts and src/b.ts most of the time. */
const history: Commit[] = [
  {
    message: 'c1',
    date: '2026-01-01T10:00:00Z',
    write: { [guide]: '1', 'src/a.ts': '1', 'src/b.ts': '1', 'README.md': '1' },
  },
  {
    message: 'c2',
    date: '2026-01-02T10:00:00Z',
    write: { [guide]: '2', 'src/a.ts': '2', 'src/b.ts': '2' },
  },
  { message: 'c3', date: '2026-01-03T10:00:00Z', write: { [guide]: '3', 'src/a.ts': '3' } },
  { message: 'c4: no guide', date: '2026-01-04T10:00:00Z', write: { 'src/c.ts': '1' } },
  {
    message: 'c5',
    date: '2026-01-05T10:00:00Z',
    write: { [guide]: '4', 'src/b.ts': '3', 'lib/x.ts': '1' },
  },
]

const withRepo = async <A>(
  use: (repo: GitRepo, git: GitRepository) => Promise<A>,
  commits: ReadonlyArray<Commit> = history,
) => {
  const repo = await createGitRepo({ history: commits })
  try {
    return await use(repo, await run(openGit(repo.root)))
  } finally {
    await repo.cleanup()
  }
}

const measure = (git: GitRepository, root: string, item = guide, options: CoChangeOptions = {}) =>
  run(coChanged(git, root, item, options))

describe('coChanged', () => {
  test('lists the files that most often change with the item', async () => {
    await withRepo(async (repo, git) => {
      const result = await measure(git, repo.root)
      expect(result.itemCommits).toBe(4)
      expect(result.partial).toBe(false)
      expect(result.files).toEqual([
        { path: 'src/b.ts', commits: 3, share: 0.75, last: '2026-01-05' },
        { path: 'src/a.ts', commits: 3, share: 0.75, last: '2026-01-03' },
      ])
    })
  })

  test('files that changed together only once are left out unless asked for', async () => {
    await withRepo(async (repo, git) => {
      const loose = await measure(git, repo.root, guide, { minCommits: 1 })
      expect(loose.files.map((f) => f.path)).toEqual([
        'src/b.ts',
        'src/a.ts',
        'lib/x.ts',
        'README.md',
      ])
    })
  })

  test('ties are broken by the most recent change, then by name', async () => {
    await withRepo(async (repo, git) => {
      const { files } = await measure(git, repo.root, guide, { minCommits: 1 })
      expect(files.map((f) => [f.commits, f.last, f.path])).toEqual([
        [3, '2026-01-05', 'src/b.ts'],
        [3, '2026-01-03', 'src/a.ts'],
        [1, '2026-01-05', 'lib/x.ts'],
        [1, '2026-01-01', 'README.md'],
      ])
    })
  })

  test('respects the limit', async () => {
    await withRepo(async (repo, git) => {
      const { files } = await measure(git, repo.root, guide, { minCommits: 1, limit: 2 })
      expect(files).toHaveLength(2)
    })
  })

  test('never lists the item itself', async () => {
    await withRepo(async (repo, git) => {
      const { files } = await measure(git, repo.root, guide, { minCommits: 1 })
      expect(files.map((f) => f.path)).not.toContain(guide)
    })
  })

  test('a file that never changed with the item is not listed', async () => {
    await withRepo(async (repo, git) => {
      const { files } = await measure(git, repo.root, guide, { minCommits: 1 })
      expect(files.map((f) => f.path)).not.toContain('src/c.ts')
    })
  })

  test('an item with no commits has no co-changes', async () => {
    await withRepo(async (repo, git) => {
      expect(await measure(git, repo.root, 'docs/missing.md')).toEqual({
        item: 'docs/missing.md',
        itemCommits: 0,
        files: [],
        partial: false,
      })
    })
  })

  test('skips commits that changed too many files', async () => {
    const many = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`gen/f${i}.ts`, 'x']))
    await withRepo(
      async (repo, git) => {
        const { files, itemCommits } = await measure(git, repo.root, guide, { minCommits: 1 })
        expect(itemCommits).toBe(5)
        expect(files.some((f) => f.path.startsWith('gen/'))).toBe(false)
        const capped = await measure(git, repo.root, guide, {
          minCommits: 1,
          maxFilesPerCommit: 100,
        })
        expect(capped.files.some((f) => f.path.startsWith('gen/'))).toBe(true)
      },
      [
        ...history,
        { message: 'mass import', date: '2026-01-06T10:00:00Z', write: { [guide]: '5', ...many } },
      ],
    )
  })

  test('leaves out the workspace knowledge files and .netherite', async () => {
    await withRepo(
      async (repo, git) => {
        const { files } = await measure(git, repo.root, 'src/a.ts', {
          minCommits: 1,
          contentRoot: 'netherite',
        })
        const paths = files.map((f) => f.path)
        expect(paths).toContain(guide)
        expect(paths.some((p) => p.startsWith('netherite/') || p.startsWith('.netherite/'))).toBe(
          false,
        )
      },
      [
        ...history,
        {
          message: 'doc and notes',
          date: '2026-01-06T10:00:00Z',
          write: {
            'src/a.ts': '4',
            'netherite/docs/DOC-1.md': 'x',
            '.netherite/config.yml': 'version: 1\n',
          },
        },
        {
          message: 'again',
          date: '2026-01-07T10:00:00Z',
          write: { 'src/a.ts': '5', 'netherite/docs/DOC-1.md': 'y' },
        },
      ],
    )
  })

  test('can leave out globs such as lock files', async () => {
    await withRepo(
      async (repo, git) => {
        const { files } = await measure(git, repo.root, guide, {
          minCommits: 1,
          exclude: ['*.lock', 'lib/**'],
        })
        expect(files.map((f) => f.path)).not.toContain('pnpm.lock')
        expect(files.map((f) => f.path)).not.toContain('lib/x.ts')
        const all = await measure(git, repo.root, guide, { minCommits: 1 })
        expect(all.files.map((f) => f.path)).toContain('pnpm.lock')
      },
      [
        ...history,
        {
          message: 'locked',
          date: '2026-01-06T10:00:00Z',
          write: { [guide]: '6', 'pnpm.lock': 'x' },
        },
      ],
    )
  })

  test('looks only at the latest commits when told to', async () => {
    await withRepo(async (repo, git) => {
      const { itemCommits, files } = await measure(git, repo.root, guide, {
        minCommits: 1,
        maxCommits: 2,
      })
      expect(itemCommits).toBe(2)
      expect(files.map((f) => f.path).sort()).toEqual(['lib/x.ts', 'src/a.ts', 'src/b.ts'])
    })
  })

  test('works in a workspace that is a subfolder of the repository', async () => {
    await withRepo(
      async (repo, git) => {
        const site = join(repo.root, 'site')
        const result = await measure(git, site, 'docs/guide.md')
        expect(result.files.map((f) => f.path)).toEqual(['src/b.ts', 'src/a.ts'])
        expect(result.files.map((f) => f.path)).not.toContain('other/z.ts')
      },
      [
        {
          message: 'a',
          date: '2026-01-01T10:00:00Z',
          write: {
            'site/docs/guide.md': '1',
            'site/src/a.ts': '1',
            'site/src/b.ts': '1',
            'other/z.ts': '1',
          },
        },
        {
          message: 'b',
          date: '2026-01-02T10:00:00Z',
          write: {
            'site/docs/guide.md': '2',
            'site/src/a.ts': '2',
            'site/src/b.ts': '2',
            'other/z.ts': '2',
          },
        },
        {
          message: 'c',
          date: '2026-01-03T10:00:00Z',
          write: { 'site/docs/guide.md': '3', 'site/src/b.ts': '3', 'other/z.ts': '3' },
        },
      ],
    )
  })

  test('is marked partial in a shallow clone', async () => {
    await withRepo(async (repo) => {
      const target = mkdtempSync(join(tmpdir(), 'netherite-shallow-'))
      try {
        execFileSync('git', ['clone', '-q', '--depth', '3', `file://${repo.root}`, 'clone'], {
          cwd: target,
        })
        const clone = join(target, 'clone')
        const git = await run(openGit(clone))
        const result = await measure(git, clone, guide, { minCommits: 1 })
        expect(result.partial).toBe(true)
        expect(result.itemCommits).toBeLessThan(4)
      } finally {
        rmSync(target, { recursive: true, force: true })
      }
    })
  })

  test('works on the fixture history', async () => {
    const repo = await createGitRepo({ fixture: 'basic', history: basicHistory })
    try {
      const git = await run(openGit(repo.root))
      const { files } = await measure(git, repo.root, 'src/util.ts', { minCommits: 2 })
      expect(files).toEqual([{ path: 'src/app.ts', commits: 2, share: 1, last: '2026-01-14' }])
    } finally {
      await repo.cleanup()
    }
  })
})

describe('suggestCovers', () => {
  const file = (path: string, commits: number, share = 0.5) => ({
    path,
    commits,
    share,
    last: '2026-01-01',
  })
  const change = (...files: ReturnType<typeof file>[]): Pick<CoChange, 'files'> => ({ files })

  test('files in one folder become a folder glob', () => {
    expect(suggestCovers(change(file('src/a.ts', 3), file('src/b.ts', 4)))).toEqual([
      { glob: 'src/**', files: ['src/a.ts', 'src/b.ts'], commits: 4 },
    ])
  })

  test('a lone file stays a path', () => {
    expect(suggestCovers(change(file('lib/x.ts', 3)))).toEqual([
      { glob: 'lib/x.ts', files: ['lib/x.ts'], commits: 3 },
    ])
  })

  test('different folders give separate suggestions, most changed first', () => {
    expect(
      suggestCovers(
        change(
          file('src/a.ts', 3),
          file('src/b.ts', 3),
          file('lib/x.ts', 5),
          file('config.json', 2),
        ),
      ),
    ).toEqual([
      { glob: 'lib/x.ts', files: ['lib/x.ts'], commits: 5 },
      { glob: 'src/**', files: ['src/a.ts', 'src/b.ts'], commits: 3 },
      { glob: 'config.json', files: ['config.json'], commits: 2 },
    ])
  })

  test('root files are never folded into a glob', () => {
    const found = suggestCovers(change(file('a.json', 2), file('b.json', 2)))
    expect(found.map((s) => s.glob)).toEqual(['a.json', 'b.json'])
  })

  test('files the item already covers are not suggested again', () => {
    expect(
      suggestCovers(change(file('src/a.ts', 3), file('lib/x.ts', 3)), { existing: ['src/**'] }),
    ).toEqual([{ glob: 'lib/x.ts', files: ['lib/x.ts'], commits: 3 }])
    expect(suggestCovers(change(file('src/a.ts', 3)), { existing: ['src'] })).toEqual([])
  })

  test('files that changed with too small a share of commits are left out', () => {
    expect(suggestCovers(change(file('src/a.ts', 1, 0.1), file('src/b.ts', 3, 0.6)))).toEqual([
      { glob: 'src/b.ts', files: ['src/b.ts'], commits: 3 },
    ])
    expect(suggestCovers(change(file('src/a.ts', 1, 0.1)), { minShare: 0.05 })).toHaveLength(1)
  })

  test('is limited to a maximum', () => {
    const many = Array.from({ length: 8 }, (_, i) => file(`d${i}/f.ts`, 10 - i))
    expect(suggestCovers(change(...many))).toHaveLength(5)
    expect(suggestCovers(change(...many), { max: 2 }).map((s) => s.glob)).toEqual([
      'd0/f.ts',
      'd1/f.ts',
    ])
  })

  test('nothing co-changed gives no suggestions', () => {
    expect(suggestCovers(change())).toEqual([])
  })

  test('the suggested globs really cover the files they stand for', async () => {
    const { compileCovers } = await import('../src/index')
    const found = suggestCovers(
      change(file('src/a.ts', 3), file('src/b.ts', 3), file('lib/x.ts', 3)),
    )
    for (const suggestion of found) {
      const test_ = compileCovers([suggestion.glob])
      for (const covered of suggestion.files) expect(test_(covered)).toBe(true)
    }
  })

  test('end to end on a real history', async () => {
    await withRepo(async (repo, git) => {
      const result = await measure(git, repo.root, guide)
      expect(suggestCovers(result)).toEqual([
        { glob: 'src/**', files: ['src/a.ts', 'src/b.ts'], commits: 3 },
      ])
    })
  })
})
