import { Duration, Effect, FileSystem, Option, Stream } from 'effect'
import { ChildProcess, ChildProcessSpawner } from 'effect/process'
import {
  GitCommandFailed,
  type GitError,
  GitNotInstalled,
  GitTimeout,
  InvalidGitArgument,
  NotARepository,
} from './errors'
import type { GitIdentity } from './identity'
import { type CommitInfo, type GitStatus, logFormat, parseLog, parseStatus } from './parse'
import { assertReadOnly } from './readonly'

export interface GitOptions {
  /** Longest a single git command may run. Default 30 s. */
  readonly timeoutMs?: number
  /** Most results kept in the cache. Default 200. */
  readonly cacheSize?: number
  /** The git program to run. Default `git`, found on the `PATH`. */
  readonly executable?: string
}

export interface LogOptions {
  /** Only commits that touched these paths (git pathspecs, relative to the repository root). */
  readonly paths?: ReadonlyArray<string>
  /** Only commits after this commit: `<since>..HEAD`. */
  readonly since?: string
  /** Only commits made after this date (ISO 8601). */
  readonly after?: string
  readonly limit?: number
  /** Which files to list per commit. Default: none. */
  readonly files?: 'none' | 'names' | 'numstat'
}

export interface StatusOptions {
  /** `all` lists every untracked file; `normal` lists untracked folders. Default `all`. */
  readonly untracked?: 'all' | 'normal' | 'no'
}

export interface GitRepository {
  /** Top of the work tree. */
  readonly root: string
  /** The `.git` folder. */
  readonly gitDir: string
  /** A shallow clone has no history before its boundary, so counts from it are lower bounds. */
  readonly shallow: boolean
  /** The current commit, or `undefined` before the first commit. */
  readonly head: Effect.Effect<string | undefined, GitError>
  /** Uncommitted changes. Cached until HEAD or the index changes, or `invalidate` is called. */
  readonly status: (options?: StatusOptions) => Effect.Effect<GitStatus, GitError>
  /** Commits, newest first. Cached per HEAD. */
  readonly log: (options?: LogOptions) => Effect.Effect<ReadonlyArray<CommitInfo>, GitError>
  /** The commit that added a path, or `undefined` if it was never committed. */
  readonly firstCommit: (path: string) => Effect.Effect<CommitInfo | undefined, GitError>
  /** `user.name`, `user.email` and `github.user` from git config. Missing values are `undefined`. */
  readonly identity: Effect.Effect<GitIdentity, GitError>
  /** Commits where a shallow clone's history stops. Empty for a full clone. */
  readonly shallowBoundary: Effect.Effect<ReadonlyArray<string>>
  /** Drops cached work-tree results. Call it when files change on disk. */
  readonly invalidate: () => void
}

export type GitAvailability =
  | { readonly available: true; readonly git: GitRepository }
  | {
      readonly available: false
      readonly reason: 'git-not-installed' | 'not-a-repository'
      readonly message: string
    }

const refPattern = /^[A-Za-z0-9._/@^~-]+$/
const datePattern = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:?\d{2})?)?$/

const checkRef = (name: string, value: string) =>
  refPattern.test(value) && !value.startsWith('-') && !value.includes('..')
    ? Effect.void
    : Effect.fail(new InvalidGitArgument({ name, value }))

const env = {
  GIT_OPTIONAL_LOCKS: '0', // never write to the index just to refresh it
  GIT_TERMINAL_PROMPT: '0',
  GIT_PAGER: 'cat',
  LC_ALL: 'C',
  // A hook or parent process may point git somewhere else; always use the folder we were given.
  GIT_DIR: undefined,
  GIT_WORK_TREE: undefined,
  GIT_INDEX_FILE: undefined,
} as const

interface Output {
  readonly stdout: string
  readonly stderr: string
  readonly code: number
}

/** Opens a repository for reading. Fails with a tagged error if git is missing or `dir` is not in a repo. */
export const openGit = (dir: string, options: GitOptions = {}) =>
  Effect.gen(function* () {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
    const fs = yield* FileSystem.FileSystem
    const timeoutMs = options.timeoutMs ?? 30_000
    const cacheSize = options.cacheSize ?? 200

    /** Runs one read-only git command in `cwd` and returns what it printed. */
    const exec = (cwd: string, args: ReadonlyArray<string>): Effect.Effect<Output, GitError> => {
      const forbidden = assertReadOnly(args)
      if (forbidden !== undefined) return Effect.fail(forbidden)
      const command = ChildProcess.make(
        options.executable ?? 'git',
        ['--no-pager', '-c', 'core.quotepath=false', '-c', 'core.fsmonitor=false', ...args],
        { cwd, env, extendEnv: true },
      )
      return Effect.scoped(
        Effect.gen(function* () {
          const handle = yield* spawner.spawn(command)
          const text = (stream: typeof handle.stdout) => Stream.mkString(Stream.decodeText(stream))
          const [stdout, stderr, code] = yield* Effect.all(
            [text(handle.stdout), text(handle.stderr), handle.exitCode],
            { concurrency: 'unbounded' },
          )
          return { stdout, stderr, code: Number(code) }
        }),
      ).pipe(
        // The process could not be started at all, most likely because git is not installed.
        Effect.mapError((cause) => new GitNotInstalled({ detail: cause.message })),
        Effect.timeoutOrElse({
          duration: Duration.millis(timeoutMs),
          orElse: () => Effect.fail(new GitTimeout({ args, ms: timeoutMs })),
        }),
      )
    }

    // 1. Is there a repository here? One call answers where it is, where .git is, and if it is shallow.
    const probe = yield* exec(dir, [
      'rev-parse',
      '--show-toplevel',
      '--absolute-git-dir',
      '--is-shallow-repository',
    ])
    if (probe.code !== 0) {
      return yield* /not a git repository/i.test(probe.stderr)
        ? Effect.fail(new NotARepository({ dir }))
        : Effect.fail(
            new GitCommandFailed({
              args: ['rev-parse'],
              exitCode: probe.code,
              stderr: probe.stderr,
            }),
          )
    }
    const [root = dir, gitDir = `${dir}/.git`, shallowText = 'false'] = probe.stdout
      .trim()
      .split('\n')
    const shallow = shallowText.trim() === 'true'

    const run = (args: ReadonlyArray<string>, okCodes: ReadonlyArray<number> = [0]) =>
      Effect.flatMap(exec(root, args), (out) =>
        okCodes.includes(out.code)
          ? Effect.succeed(out)
          : Effect.fail(new GitCommandFailed({ args, exitCode: out.code, stderr: out.stderr })),
      )

    // 2. A small memo: results are kept until the key changes, and a failure is never kept.
    const cache = new Map<string, Effect.Effect<unknown, GitError>>()
    let epoch = 0
    const memo = <A>(key: string, make: Effect.Effect<A, GitError>): Effect.Effect<A, GitError> =>
      Effect.gen(function* () {
        let cached = cache.get(key) as Effect.Effect<A, GitError> | undefined
        if (cached === undefined) {
          cached = yield* Effect.cached(make)
          cache.set(key, cached)
          if (cache.size > cacheSize) cache.delete(cache.keys().next().value as string)
        }
        return yield* cached.pipe(Effect.tapError(() => Effect.sync(() => cache.delete(key))))
      })

    const head: GitRepository['head'] = Effect.map(
      run(['rev-parse', '--verify', '-q', 'HEAD'], [0, 1]),
      (out) => (out.code === 0 ? out.stdout.trim() : undefined),
    )

    const indexStamp = fs.stat(`${gitDir}/index`).pipe(
      Effect.map((info) => (Option.isSome(info.mtime) ? String(info.mtime.value.getTime()) : '')),
      Effect.orElseSucceed(() => ''),
    )

    const status: GitRepository['status'] = (statusOptions = {}) =>
      Effect.gen(function* () {
        const untracked = statusOptions.untracked ?? 'all'
        const key = `status|${yield* head}|${yield* indexStamp}|${epoch}|${untracked}`
        return yield* memo(
          key,
          Effect.map(
            run(['status', '--porcelain=v2', '--branch', '-z', `--untracked-files=${untracked}`]),
            (out) => parseStatus(out.stdout),
          ),
        )
      })

    const log: GitRepository['log'] = (logOptions = {}) =>
      Effect.gen(function* () {
        const files = logOptions.files ?? 'none'
        if (logOptions.since !== undefined) yield* checkRef('commit', logOptions.since)
        if (logOptions.after !== undefined && !datePattern.test(logOptions.after)) {
          return yield* Effect.fail(
            new InvalidGitArgument({ name: 'date', value: logOptions.after }),
          )
        }
        const current = yield* head
        if (current === undefined) return [] as CommitInfo[]

        const args = [
          'log',
          `--format=${logFormat}`,
          '--no-renames',
          ...(files === 'names' ? ['--name-only'] : files === 'numstat' ? ['--numstat'] : []),
          ...(logOptions.limit === undefined
            ? []
            : [`--max-count=${Math.max(1, Math.floor(logOptions.limit))}`]),
          ...(logOptions.after === undefined ? [] : [`--since=${logOptions.after}`]),
          logOptions.since === undefined ? 'HEAD' : `${logOptions.since}..HEAD`,
          '--',
          ...(logOptions.paths ?? []),
        ]
        const key = `log|${current}|${JSON.stringify(args)}`
        return yield* memo(
          key,
          Effect.map(run(args), (out) => parseLog(out.stdout, files)),
        )
      })

    const firstCommit: GitRepository['firstCommit'] = (path) =>
      Effect.gen(function* () {
        const current = yield* head
        if (current === undefined) return undefined
        const args = [
          'log',
          `--format=${logFormat}`,
          '--no-renames',
          '--diff-filter=A',
          'HEAD',
          '--',
          path,
        ]
        const commits = yield* memo(
          `first|${current}|${path}`,
          Effect.map(run(args), (out) => parseLog(out.stdout, 'none')),
        )
        return commits.at(-1)
      })

    const config = (key: string) =>
      Effect.map(run(['config', '--get', key], [0, 1]), (out) => {
        const value = out.stdout.trim()
        return out.code === 0 && value !== '' ? value : undefined
      })

    const identity: GitRepository['identity'] = Effect.all(
      { name: config('user.name'), email: config('user.email'), github: config('github.user') },
      { concurrency: 'unbounded' },
    )

    const shallowBoundary: GitRepository['shallowBoundary'] = shallow
      ? fs.readFileString(`${gitDir}/shallow`).pipe(
          Effect.map((text) => text.split('\n').filter((line) => line.trim() !== '')),
          Effect.orElseSucceed(() => [] as string[]),
        )
      : Effect.succeed([])

    const repository: GitRepository = {
      root,
      gitDir,
      shallow,
      head,
      status,
      log,
      firstCommit,
      identity,
      shallowBoundary,
      invalidate: () => {
        epoch++
        for (const key of [...cache.keys()]) if (key.startsWith('status|')) cache.delete(key)
      },
    }
    return repository
  })

/**
 * Like `openGit`, but never fails for the expected reasons: with no git installed or outside a
 * repository it says so, and the caller shows "not available" for git-derived features.
 */
export const detectGit = (dir: string, options: GitOptions = {}) =>
  openGit(dir, options).pipe(
    Effect.map((git): GitAvailability => ({ available: true, git })),
    Effect.catchTags({
      GitNotInstalled: (error) =>
        Effect.succeed<GitAvailability>({
          available: false,
          reason: 'git-not-installed',
          message: error.message,
        }),
      NotARepository: (error) =>
        Effect.succeed<GitAvailability>({
          available: false,
          reason: 'not-a-repository',
          message: error.message,
        }),
    }),
  )
