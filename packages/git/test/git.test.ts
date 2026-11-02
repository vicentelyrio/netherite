import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { devNull, tmpdir } from 'node:os'
import { join } from 'node:path'
import { createGitRepo } from '@netherite/testing'
import { Effect } from 'effect'
import { beforeAll, describe, expect, test } from 'vitest'
import { changedPaths, detectGit, type GitRepository, openGit } from '../src/index'
import { recorder, services, sh, withRepo } from './helpers'

const run = <A, E>(
  effect: Effect.Effect<A, E, import('@effect/platform-node').NodeServices.NodeServices>,
) => Effect.runPromise(effect.pipe(Effect.provide(services)))
const open = (dir: string) => run(openGit(dir))
const fail = <A, E>(
  effect: Effect.Effect<A, E, import('@effect/platform-node').NodeServices.NodeServices>,
) => Effect.runPromise(Effect.flip(effect).pipe(Effect.provide(services)))

// Tests must not see the machine's own git identity or settings.
beforeAll(() => {
  process.env.GIT_CONFIG_GLOBAL = devNull
  process.env.GIT_CONFIG_SYSTEM = devNull
})

describe('opening', () => {
  test('finds the root, the git folder and that it is not shallow', async () => {
    await withRepo(async (repo) => {
      const git = await open(join(repo.root, 'src'))
      expect(await run(Effect.sync(() => git.root))).toMatch(/netherite-git-/)
      expect(git.gitDir.endsWith('.git')).toBe(true)
      expect(git.shallow).toBe(false)
    })
  })

  test('a folder outside any repository is NotARepository', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'netherite-nogit-'))
    try {
      expect(await fail(openGit(dir))).toMatchObject({ _tag: 'NotARepository', dir })
      const detected = await run(detectGit(dir))
      expect(detected).toMatchObject({ available: false, reason: 'not-a-repository' })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('a missing git program is GitNotInstalled', async () => {
    await withRepo(async (repo) => {
      const options = { executable: '/definitely/not/git' }
      expect(await fail(openGit(repo.root, options))).toMatchObject({ _tag: 'GitNotInstalled' })
      expect(await run(detectGit(repo.root, options))).toMatchObject({
        available: false,
        reason: 'git-not-installed',
      })
    })
  })

  test('detectGit gives the repository when there is one', async () => {
    await withRepo(async (repo) => {
      const detected = await run(detectGit(repo.root))
      expect(detected.available).toBe(true)
    })
  })

  test('a repository with no commits works: no head, no history', async () => {
    const repo = await createGitRepo({ initial: undefined as never })
    try {
      sh(repo.root, 'update-ref', '-d', 'HEAD')
      const git = await open(repo.root)
      expect(await run(git.head)).toBeUndefined()
      expect(await run(git.log())).toEqual([])
      expect((await run(git.status())).oid).toBeUndefined()
      expect(await run(git.firstCommit('x'))).toBeUndefined()
    } finally {
      await repo.cleanup()
    }
  })
})

describe('head, status', () => {
  test('head is the latest commit', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      expect(await run(git.head)).toBe(repo.git('rev-parse', 'HEAD'))
    })
  })

  test('a clean tree has no entries', async () => {
    await withRepo(async (repo) => {
      const status = await run((await open(repo.root)).status())
      expect(status).toMatchObject({
        branch: 'main',
        oid: repo.git('rev-parse', 'HEAD'),
        entries: [],
        ahead: 0,
      })
    })
  })

  test('reports unstaged, staged and untracked changes', async () => {
    await withRepo(async (repo) => {
      writeFileSync(join(repo.root, 'src', 'app.ts'), 'changed\n')
      writeFileSync(join(repo.root, 'src', 'util.ts'), 'staged\n')
      sh(repo.root, 'add', 'src/util.ts')
      writeFileSync(join(repo.root, 'new file.md'), 'new\n')
      const status = await run((await open(repo.root)).status())
      expect(status.entries).toEqual([
        { path: 'src/app.ts', kind: 'ordinary', index: '.', worktree: 'M' },
        { path: 'src/util.ts', kind: 'ordinary', index: 'M', worktree: '.' },
        { path: 'new file.md', kind: 'untracked', index: '.', worktree: '?' },
      ])
      expect(changedPaths(status)).toHaveLength(3)
    })
  })

  test('lists untracked files one by one by default, or folders on request', async () => {
    await withRepo(async (repo) => {
      writeFileSync(join(repo.root, 'extra-a.md'), 'a')
      sh(repo.root, 'checkout', '-q', '--', '.')
      const dir = join(repo.root, 'newdir')
      require('node:fs').mkdirSync(dir)
      writeFileSync(join(dir, 'one.md'), '1')
      writeFileSync(join(dir, 'two.md'), '2')
      const git = await open(repo.root)
      expect((await run(git.status())).entries.map((e) => e.path).sort()).toEqual([
        'extra-a.md',
        'newdir/one.md',
        'newdir/two.md',
      ])
      expect(
        (await run(git.status({ untracked: 'normal' }))).entries.map((e) => e.path).sort(),
      ).toEqual(['extra-a.md', 'newdir/'])
      expect((await run(git.status({ untracked: 'no' }))).entries).toEqual([])
    })
  })

  test('a rename shows both paths', async () => {
    await withRepo(async (repo) => {
      sh(repo.root, 'mv', 'src/util.ts', 'src/helpers.ts')
      const status = await run((await open(repo.root)).status())
      expect(status.entries).toEqual([
        { path: 'src/helpers.ts', from: 'src/util.ts', kind: 'renamed', index: 'R', worktree: '.' },
      ])
    })
  })

  test('paths with spaces and non-ASCII characters come back as written', async () => {
    await withRepo(async (repo) => {
      writeFileSync(join(repo.root, 'ação rápida.md'), 'x')
      const status = await run((await open(repo.root)).status())
      expect(status.entries.map((e) => e.path)).toEqual(['ação rápida.md'])
    })
  })
})

describe('log', () => {
  test('lists commits newest first, with authors and dates', async () => {
    await withRepo(async (repo) => {
      const commits = await run((await open(repo.root)).log())
      expect(commits.map((c) => c.subject)).toEqual([
        'fix: trim output',
        'refactor: split utilities',
        'feat: add farewell',
        'feat: add greeting',
        'chore: initial commit',
      ])
      expect(commits[2]).toMatchObject({
        author: { name: 'Grace Hopper', email: 'grace@example.com' },
        date: '2026-01-11T10:00:00Z',
      })
      expect(commits[0]?.hash).toBe(repo.git('rev-parse', 'HEAD'))
    })
  })

  test('can list the files each commit touched', async () => {
    await withRepo(async (repo) => {
      const commits = await run((await open(repo.root)).log({ files: 'names', limit: 2 }))
      expect(commits.map((c) => c.files.map((f) => f.path).sort())).toEqual([
        ['src/app.ts'],
        ['src/app.ts', 'src/util.ts'],
      ])
    })
  })

  test('numstat counts added and deleted lines', async () => {
    await withRepo(async (repo) => {
      const [latest] = await run((await open(repo.root)).log({ files: 'numstat', limit: 1 }))
      expect(latest?.files).toEqual([{ path: 'src/app.ts', added: 1, deleted: 1 }])
    })
  })

  test('limits to paths', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      expect((await run(git.log({ paths: ['src/app.ts'] }))).length).toBe(5)
      expect((await run(git.log({ paths: ['src/util.ts'] }))).map((c) => c.subject)).toEqual([
        'refactor: split utilities',
        'chore: initial commit',
      ])
      expect(await run(git.log({ paths: ['nope.txt'] }))).toEqual([])
    })
  })

  test('counts the commits after a date, like freshness will', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      const after = await run(git.log({ after: '2026-01-10', paths: ['src'] }))
      expect(after.map((c) => c.subject)).toEqual([
        'fix: trim output',
        'refactor: split utilities',
        'feat: add farewell',
      ])
    })
  })

  test('lists the commits after a commit', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      const base = repo.git('rev-parse', 'HEAD~2')
      const since = await run(git.log({ since: base }))
      expect(since.map((c) => c.subject)).toEqual(['fix: trim output', 'refactor: split utilities'])
    })
  })

  test('readCommits returns whole commits, in the order asked', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      const [refactor, greeting] = [
        repo.git('rev-parse', 'HEAD~1'),
        repo.git('rev-parse', 'HEAD~3'),
      ]
      const found = await run(git.readCommits([greeting, refactor], { files: 'names' }))
      expect(found.map((c) => c.subject)).toEqual([
        'feat: add greeting',
        'refactor: split utilities',
      ])
      expect(found[1]?.files.map((f) => f.path).sort()).toEqual(['src/app.ts', 'src/util.ts'])
      expect(await run(git.readCommits([]))).toEqual([])
    })
  })

  test('readCommits refuses anything that is not a commit id', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      for (const bad of ['--output=/tmp/x', 'HEAD', 'main', 'abc def', '']) {
        expect(await fail(git.readCommits([bad])), bad).toMatchObject({
          _tag: 'InvalidGitArgument',
        })
      }
    })
  })

  test('firstCommit is the commit that added the path', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      expect((await run(git.firstCommit('src/app.ts')))?.subject).toBe('chore: initial commit')
      expect(await run(git.firstCommit('never-committed.md'))).toBeUndefined()
      sh(repo.root, 'checkout', '-q', '-b', 'x')
      writeFileSync(join(repo.root, 'later.md'), 'x')
      sh(repo.root, 'add', 'later.md')
      sh(repo.root, 'commit', '-q', '-m', 'add later', '--author=A <a@b.c>')
      expect((await run(git.firstCommit('later.md')))?.subject).toBe('add later')
    })
  })

  test('arguments that look like options are refused', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      expect(await fail(git.log({ since: '--output=/tmp/pwned' }))).toMatchObject({
        _tag: 'InvalidGitArgument',
        name: 'commit',
      })
      expect(await fail(git.log({ since: 'HEAD..HEAD~1' }))).toMatchObject({
        _tag: 'InvalidGitArgument',
      })
      expect(await fail(git.log({ since: 'a b' }))).toMatchObject({ _tag: 'InvalidGitArgument' })
      expect(await fail(git.log({ after: '--since=x' }))).toMatchObject({
        _tag: 'InvalidGitArgument',
        name: 'date',
      })
      expect(await fail(git.log({ after: 'yesterday' }))).toMatchObject({
        _tag: 'InvalidGitArgument',
      })
    })
  })

  test('a path that looks like an option is treated as a path', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      expect(await run(git.log({ paths: ['--output=/tmp/should-not-exist'] }))).toEqual([])
      expect(() => statSync('/tmp/should-not-exist')).toThrow()
    })
  })
})

describe('identity', () => {
  test('missing values are undefined', async () => {
    await withRepo(async (repo) => {
      expect(await run((await open(repo.root)).identity)).toEqual({
        name: undefined,
        email: undefined,
        github: undefined,
      })
    })
  })

  test('reads user.name, user.email and github.user', async () => {
    await withRepo(async (repo) => {
      sh(repo.root, 'config', 'user.name', 'Ada Lovelace')
      sh(repo.root, 'config', 'user.email', 'ada@example.com')
      sh(repo.root, 'config', 'github.user', 'ada')
      expect(await run((await open(repo.root)).identity)).toEqual({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        github: 'ada',
      })
    })
  })
})

describe('shallow clones', () => {
  test('are detected, with their boundary', async () => {
    await withRepo(async (repo) => {
      const target = mkdtempSync(join(tmpdir(), 'netherite-shallow-'))
      try {
        sh(target, 'clone', '-q', '--depth', '2', `file://${repo.root}`, 'clone')
        const git = await open(join(target, 'clone'))
        expect(git.shallow).toBe(true)
        const boundary = await run(git.shallowBoundary)
        expect(boundary).toHaveLength(1)
        const commits = await run(git.log())
        expect(commits).toHaveLength(2)
        expect(boundary[0]).toBe(commits.at(-1)?.hash)
      } finally {
        rmSync(target, { recursive: true, force: true })
      }
    })
  })

  test('a full repository has no boundary', async () => {
    await withRepo(async (repo) => {
      expect(await run((await open(repo.root)).shallowBoundary)).toEqual([])
    })
  })
})

describe('caching', () => {
  const countOf = (commands: ReadonlyArray<ReadonlyArray<string>>, name: string) =>
    commands.filter((c) => c[0] === name).length

  const opened = async (dir: string) => {
    const spy = recorder()
    const git = await Effect.runPromise(
      openGit(dir).pipe(Effect.provide(spy.layer), Effect.provide(services)),
    )
    return { git, spy }
  }
  const go = <A, E>(
    spy: ReturnType<typeof recorder>,
    effect: Effect.Effect<A, E, never | import('@effect/platform-node').NodeServices.NodeServices>,
  ) =>
    Effect.runPromise(
      effect.pipe(Effect.provide(services)).pipe(Effect.provide(spy.layer)) as Effect.Effect<A, E>,
    )

  test('the same history query runs git once per HEAD', async () => {
    await withRepo(async (repo) => {
      const { git, spy } = await opened(repo.root)
      const first = await run(git.log({ files: 'names' }))
      const second = await run(git.log({ files: 'names' }))
      void go
      expect(second).toEqual(first)
      expect(countOf(spy.commands, 'log')).toBe(1)
    })
  })

  test('different queries are cached separately', async () => {
    await withRepo(async (repo) => {
      const { git, spy } = await opened(repo.root)
      await run(git.log({ paths: ['src/app.ts'] }))
      await run(git.log({ paths: ['src/util.ts'] }))
      await run(git.log({ paths: ['src/app.ts'] }))
      expect(countOf(spy.commands, 'log')).toBe(2)
    })
  })

  test('a new commit is a new HEAD, so history is queried again', async () => {
    await withRepo(async (repo) => {
      const { git, spy } = await opened(repo.root)
      const before = await run(git.log())
      writeFileSync(join(repo.root, 'more.md'), 'x')
      sh(repo.root, 'add', 'more.md')
      sh(repo.root, 'commit', '-q', '-m', 'more', '--author=A <a@b.c>')
      const after = await run(git.log())
      expect(after.length).toBe(before.length + 1)
      expect(countOf(spy.commands, 'log')).toBe(2)
    })
  })

  test('status is kept until HEAD or the index changes, or it is invalidated', async () => {
    await withRepo(async (repo) => {
      const { git, spy } = await opened(repo.root)
      await run(git.status())
      await run(git.status())
      expect(countOf(spy.commands, 'status')).toBe(1)

      // An edit that git has not been told about does not touch HEAD or the index, so the
      // cached status is stale until the caller says files changed.
      writeFileSync(join(repo.root, 'src', 'app.ts'), 'edited\n')
      expect((await run(git.status())).entries).toEqual([])
      git.invalidate()
      expect((await run(git.status())).entries).toHaveLength(1)
      expect(countOf(spy.commands, 'status')).toBe(2)

      // Staging changes the index, which refreshes the cache by itself.
      sh(repo.root, 'add', 'src/app.ts')
      expect((await run(git.status())).entries[0]).toMatchObject({ index: 'M' })
    })
  })

  test('a failed command is not remembered', async () => {
    await withRepo(async (repo) => {
      const { git } = await opened(repo.root)
      const bad = await fail(git.log({ since: 'no-such-ref' }))
      expect(bad).toMatchObject({ _tag: 'GitCommandFailed' })
      expect(await fail(git.log({ since: 'no-such-ref' }))).toMatchObject({
        _tag: 'GitCommandFailed',
      })
    })
  })

  test('the cache stays within its size', async () => {
    await withRepo(async (repo) => {
      const spy = recorder()
      const git = await Effect.runPromise(
        openGit(repo.root, { cacheSize: 2 }).pipe(
          Effect.provide(spy.layer),
          Effect.provide(services),
        ),
      )
      for (const path of ['a', 'b', 'c']) await run(git.log({ paths: [path] }))
      await run(git.log({ paths: ['a'] })) // evicted, so it runs again
      expect(countOf(spy.commands, 'log')).toBe(4)
    })
  })
})

describe('timeouts', () => {
  test.skipIf(process.platform === 'win32')(
    'a command that takes too long is stopped',
    async () => {
      await withRepo(async (repo) => {
        const dir = mkdtempSync(join(tmpdir(), 'netherite-slow-'))
        const script = join(dir, 'git')
        writeFileSync(
          script,
          `#!/bin/sh\nif [ "$3" = "rev-parse" ] || [ "$4" = "rev-parse" ] || echo "$@" | grep -q rev-parse; then exec git "$@"; fi\nsleep 5\n`,
        )
        chmodSync(script, 0o755)
        try {
          const started = Date.now()
          const git = await run(openGit(repo.root, { executable: script, timeoutMs: 1500 }))
          const error = await fail(git.status())
          expect(error).toMatchObject({ _tag: 'GitTimeout', ms: 1500 })
          expect(Date.now() - started).toBeLessThan(5000)
        } finally {
          rmSync(dir, { recursive: true, force: true })
        }
      })
    },
  )
})

describe('read-only', () => {
  const everything = async (git: GitRepository, root: string) => {
    sh(root, 'config', 'user.name', 'T')
    await run(git.head)
    await run(git.status())
    await run(git.status({ untracked: 'normal' }))
    await run(git.log({ files: 'numstat', paths: ['src'], after: '2026-01-01', limit: 3 }))
    await run(git.log({ since: sh(root, 'rev-parse', 'HEAD~1') }))
    await run(git.firstCommit('src/app.ts'))
    await run(git.identity)
    await run(git.shallowBoundary)
    git.invalidate()
    await run(git.status())
  }

  test('only runs read-only subcommands, and config only to read', async () => {
    await withRepo(async (repo) => {
      const spy = recorder()
      const git = await Effect.runPromise(
        openGit(repo.root).pipe(Effect.provide(spy.layer), Effect.provide(services)),
      )
      await everything(git, repo.root)
      // The recorder wraps the spawner given to openGit, so commands made after opening were seen.
      const { readOnlySubcommands } = await import('../src/index')
      expect(spy.commands.length).toBeGreaterThan(5)
      for (const command of spy.commands) {
        expect(readOnlySubcommands as ReadonlyArray<string>, command.join(' ')).toContain(
          command[0],
        )
        if (command[0] === 'config') expect(command).toContain('--get')
      }
    })
  })

  test('leaves the repository exactly as it was', async () => {
    await withRepo(async (repo) => {
      // Make the index look out of date, so a careless `git status` would rewrite it.
      const file = join(repo.root, 'src', 'app.ts')
      const later = new Date(Date.now() + 5000)
      utimesSync(file, later, later)
      const indexPath = join(repo.root, '.git', 'index')
      const snapshot = () => ({
        index: readFileSync(indexPath).toString('hex'),
        indexMtime: statSync(indexPath).mtimeMs,
        head: sh(repo.root, 'rev-parse', 'HEAD'),
        refs: sh(repo.root, 'for-each-ref'),
        tree: readFileSync(file, 'utf8'),
        porcelain: sh(repo.root, 'status', '--porcelain'),
        lock: (() => {
          try {
            statSync(join(repo.root, '.git', 'index.lock'))
            return true
          } catch {
            return false
          }
        })(),
      })
      const before = snapshot()
      const git = await open(repo.root)
      await everything(git, repo.root).catch(() => undefined)
      const after = snapshot()
      expect(after.index).toBe(before.index)
      expect(after.indexMtime).toBe(before.indexMtime)
      expect({ ...after, lock: false }).toEqual({ ...before, lock: false })
      expect(after.lock).toBe(false)
    })
  })

  test('exposes no function that could write', async () => {
    const mod = await import('../src/index')
    const git = await withRepo(async (repo) => open(repo.root))
    const names = [...Object.keys(mod), ...Object.keys(git)].map((n) => n.toLowerCase())
    for (const verb of [
      'commit',
      'checkout',
      'add',
      'reset',
      'push',
      'pull',
      'fetch',
      'merge',
      'rebase',
      'stash',
      'clean',
      'rm',
      'mv',
      'branch',
      'tag',
      'init',
      'clone',
      'switch',
      'restore',
      'apply',
      'cherry',
      'revert',
      'write',
      'exec',
      'run',
      'spawn',
    ]) {
      expect(
        names.filter((n) => n === verb || n.startsWith(verb)),
        verb,
      ).toEqual([])
    }
  })
})

describe('patchLog', () => {
  test('shows each commit with the new side of its changes', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      const commits = await run(git.patchLog({ paths: ['src'] }))
      expect(commits.map((c) => c.subject)).toEqual([
        'fix: trim output',
        'refactor: split utilities',
        'feat: add farewell',
        'feat: add greeting',
        'chore: initial commit',
      ])
      const refactor = commits[1]
      expect(refactor?.patches.map((p) => p.path).sort()).toEqual(['src/app.ts', 'src/util.ts'])
      expect(refactor?.patches.find((p) => p.path === 'src/util.ts')?.hunks[0]?.lines).toEqual([
        'export const util = () => "hello and bye"',
      ])
      expect(commits.at(-1)?.patches.every((p) => p.added)).toBe(true)
    })
  })

  test('with enough context a hunk covers the whole top of a file', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      const file = join(repo.root, 'notes.md')
      const lines = [
        '---',
        'status: proposed',
        'title: T',
        '---',
        ...Array.from({ length: 30 }, (_, i) => `line ${i}`),
      ]
      writeFileSync(file, `${lines.join('\n')}\n`)
      sh(repo.root, 'add', 'notes.md')
      sh(repo.root, 'commit', '-q', '-m', 'add notes', '--author=A <a@b.c>')
      writeFileSync(file, `${lines.join('\n').replace('proposed', 'accepted')}\n`)
      sh(repo.root, 'commit', '-q', '-am', 'accept', '--author=A <a@b.c>')
      const [accept] = await run(git.patchLog({ paths: ['notes.md'], limit: 1 }))
      const hunk = accept?.patches[0]?.hunks[0]
      expect(hunk?.newStart).toBe(1)
      expect(hunk?.lines.slice(0, 4)).toEqual(['---', 'status: accepted', 'title: T', '---'])
    })
  })

  test('a deleted file is reported as deleted', async () => {
    await withRepo(async (repo) => {
      sh(repo.root, 'rm', '-q', 'src/util.ts')
      sh(repo.root, 'commit', '-q', '-m', 'remove util', '--author=A <a@b.c>')
      const git = await open(repo.root)
      const [latest] = await run(git.patchLog({ paths: ['src'], limit: 1 }))
      expect(latest?.patches).toMatchObject([{ path: 'src/util.ts', deleted: true }])
    })
  })

  test('honours after and limit, is cached per HEAD, and runs only a read-only command', async () => {
    await withRepo(async (repo) => {
      const spy = recorder()
      const git = await Effect.runPromise(
        openGit(repo.root).pipe(Effect.provide(spy.layer), Effect.provide(services)),
      )
      expect(
        (await run(git.patchLog({ paths: ['src'], after: '2026-01-12' }))).map((c) => c.subject),
      ).toEqual(['fix: trim output', 'refactor: split utilities'])
      await run(git.patchLog({ paths: ['src'], limit: 1 }))
      await run(git.patchLog({ paths: ['src'], limit: 1 }))
      expect(spy.commands.filter((c) => c[0] === 'log').length).toBe(2)
    })
  })

  test('is not fooled by an external diff driver or textconv from the user config', async () => {
    await withRepo(async (repo) => {
      sh(repo.root, 'config', 'diff.external', '/bin/false')
      const git = await open(repo.root)
      expect((await run(git.patchLog({ paths: ['src'], limit: 1 }))).length).toBe(1)
    })
  })

  test('refuses a bad date, and an empty repository has no patches', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      expect(await fail(git.patchLog({ paths: ['src'], after: '--output=x' }))).toMatchObject({
        _tag: 'InvalidGitArgument',
      })
    })
    const empty = await createGitRepo({ initial: undefined as never })
    try {
      sh(empty.root, 'update-ref', '-d', 'HEAD')
      expect(await run((await open(empty.root)).patchLog({ paths: ['x'] }))).toEqual([])
    } finally {
      await empty.cleanup()
    }
  })
})

describe('fileAt', () => {
  test('is a file as committed, not as it is on disk now', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      const committed = readFileSync(join(repo.root, 'src', 'app.ts'), 'utf8')
      writeFileSync(join(repo.root, 'src', 'app.ts'), 'edited and not committed\n')
      expect(await run(git.fileAt('src/app.ts'))).toBe(committed)
      expect(await run(git.fileAt('src/app.ts', 'HEAD'))).toBe(committed)
    })
  })

  test('reads an older commit', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      const first = repo.git('rev-list', '--max-parents=0', 'HEAD')
      const older = repo.git('show', `${first}:src/app.ts`)
      expect((await run(git.fileAt('src/app.ts', first)))?.trim()).toBe(older.trim())
    })
  })

  test('is undefined for a file that was never committed', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      writeFileSync(join(repo.root, 'new.md'), 'new\n')
      expect(await run(git.fileAt('new.md'))).toBeUndefined()
      expect(await run(git.fileAt('no/such/file.md'))).toBeUndefined()
    })
  })

  test('refuses an argument that could be an option, or a revision with odd characters', async () => {
    await withRepo(async (repo) => {
      const git = await open(repo.root)
      expect((await fail(git.fileAt('--output=x')))._tag).toBe('InvalidGitArgument')
      expect((await fail(git.fileAt('')))._tag).toBe('InvalidGitArgument')
      expect((await fail(git.fileAt('src/app.ts', '--all')))._tag).toBe('InvalidGitArgument')
      expect((await fail(git.fileAt('src/app.ts', 'HEAD; rm -rf /')))._tag).toBe(
        'InvalidGitArgument',
      )
    })
  })

  test('runs only git show, which writes nothing', async () => {
    await withRepo(async (repo) => {
      const spy = recorder()
      const git = await Effect.runPromise(
        openGit(repo.root).pipe(Effect.provide(spy.layer), Effect.provide(services)),
      )
      const before = sh(repo.root, 'status', '--porcelain')
      spy.commands.length = 0
      await Effect.runPromise(
        git
          .fileAt('src/app.ts')
          .pipe(Effect.provide(services), Effect.provide(spy.layer)) as Effect.Effect<unknown>,
      )
      expect(spy.commands.map((c) => c[0])).toEqual(['show'])
      expect(sh(repo.root, 'status', '--porcelain')).toBe(before)
    })
  })
})
