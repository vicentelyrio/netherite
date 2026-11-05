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
import {
  type CommitInfo,
  type CommitPatch,
  type GitStatus,
  logFormat,
  parseLog,
  parsePatchLog,
  parseStatus,
} from './parse'
import { assertReadOnly } from './readonly'

export interface GitOptions {
  readonly timeoutMs?: number
  readonly cacheSize?: number
  readonly executable?: string
}

export interface LogOptions {
  readonly paths?: ReadonlyArray<string>
  readonly since?: string
  readonly after?: string
  readonly limit?: number
  readonly files?: 'none' | 'names' | 'numstat'
}

export interface PatchLogOptions {
  readonly paths: ReadonlyArray<string>
  readonly after?: string
  readonly limit?: number
  readonly context?: number
}

export interface StatusOptions {
  readonly untracked?: 'all' | 'normal' | 'no'
}

export interface GitRepository {
  readonly root: string
  readonly gitDir: string
  readonly shallow: boolean
  readonly head: Effect.Effect<string | undefined, GitError>
  readonly status: (options?: StatusOptions) => Effect.Effect<GitStatus, GitError>
  readonly log: (options?: LogOptions) => Effect.Effect<ReadonlyArray<CommitInfo>, GitError>
  readonly patchLog: (
    options: PatchLogOptions,
  ) => Effect.Effect<ReadonlyArray<CommitPatch>, GitError>
  readonly readCommits: (
    hashes: ReadonlyArray<string>,
    options?: { readonly files?: 'none' | 'names' | 'numstat' },
  ) => Effect.Effect<ReadonlyArray<CommitInfo>, GitError>
  readonly firstCommit: (path: string) => Effect.Effect<CommitInfo | undefined, GitError>
  readonly fileAt: (path: string, rev?: string) => Effect.Effect<string | undefined, GitError>
  readonly identity: Effect.Effect<GitIdentity, GitError>
  readonly shallowBoundary: Effect.Effect<ReadonlyArray<string>>
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
  GIT_OPTIONAL_LOCKS: '0',
  GIT_TERMINAL_PROMPT: '0',
  GIT_PAGER: 'cat',
  LC_ALL: 'C',
  GIT_DIR: undefined,
  GIT_WORK_TREE: undefined,
  GIT_INDEX_FILE: undefined,
} as const

interface Output {
  readonly stdout: string
  readonly stderr: string
  readonly code: number
}

export const openGit = (dir: string, options: GitOptions = {}) =>
  Effect.gen(function* () {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
    const fs = yield* FileSystem.FileSystem
    const timeoutMs = options.timeoutMs ?? 30_000
    const cacheSize = options.cacheSize ?? 200

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
        Effect.mapError((cause) => new GitNotInstalled({ detail: cause.message })),
        Effect.timeoutOrElse({
          duration: Duration.millis(timeoutMs),
          orElse: () => Effect.fail(new GitTimeout({ args, ms: timeoutMs })),
        }),
      )
    }

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

    const fileAt: GitRepository['fileAt'] = (filePath, rev = 'HEAD') =>
      Effect.gen(function* () {
        if (filePath === '' || filePath.includes('\0') || filePath.startsWith('-')) {
          return yield* Effect.fail(new InvalidGitArgument({ name: 'path', value: filePath }))
        }
        yield* checkRef('revision', rev)
        const out = yield* run(['show', `${rev}:${filePath}`], [0, 128])
        return out.code === 0 ? out.stdout : undefined
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

    const patchLog: GitRepository['patchLog'] = (patchOptions) =>
      Effect.gen(function* () {
        if (patchOptions.after !== undefined && !datePattern.test(patchOptions.after)) {
          return yield* Effect.fail(
            new InvalidGitArgument({ name: 'date', value: patchOptions.after }),
          )
        }
        const current = yield* head
        if (current === undefined) return [] as CommitPatch[]
        const context = Math.max(0, Math.min(5000, Math.floor(patchOptions.context ?? 60)))
        const args = [
          'log',
          '-p',
          '--no-ext-diff',
          '--no-textconv',
          '--no-color',
          `-U${context}`,
          `--format=${logFormat}`,
          '--no-renames',
          ...(patchOptions.limit === undefined
            ? []
            : [`--max-count=${Math.max(1, Math.floor(patchOptions.limit))}`]),
          ...(patchOptions.after === undefined ? [] : [`--since=${patchOptions.after}`]),
          'HEAD',
          '--',
          ...patchOptions.paths,
        ]
        return yield* memo(
          `patch|${current}|${JSON.stringify(args)}`,
          Effect.map(run(args), (out) => parsePatchLog(out.stdout)),
        )
      })

    const readCommits: GitRepository['readCommits'] = (hashes, commitOptions = {}) =>
      Effect.gen(function* () {
        for (const hash of hashes) {
          if (!/^[0-9a-f]{4,64}$/i.test(hash)) {
            return yield* Effect.fail(new InvalidGitArgument({ name: 'commit', value: hash }))
          }
        }
        if (hashes.length === 0) return [] as CommitInfo[]
        const files = commitOptions.files ?? 'none'
        const args = [
          'log',
          '--no-walk=unsorted',
          `--format=${logFormat}`,
          '--no-renames',
          ...(files === 'names' ? ['--name-only'] : files === 'numstat' ? ['--numstat'] : []),
          ...hashes,
          '--',
        ]
        return yield* memo(
          `commits|${JSON.stringify(args)}`,
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
      patchLog,
      readCommits,
      fileAt,
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
