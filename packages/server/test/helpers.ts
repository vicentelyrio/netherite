import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { NodeServices } from '@effect/platform-node'
import { makeClient } from '@netherite/api'
import { gitHandle, openRepo, type WatchBackend, workspaceGit } from '@netherite/core'
import { cleanWorkspaceFiles, emptyGitConfig } from '@netherite/testing'
import { Effect, type Scope } from 'effect'
import { FetchHttpClient } from 'effect/http'
import { listen, makeState, type ServerState, startLive } from '../src/index'

export const isolateGit = () => {
  process.env.GIT_CONFIG_GLOBAL = emptyGitConfig
  process.env.GIT_CONFIG_SYSTEM = emptyGitConfig
}

export interface Running {
  readonly dir: string
  readonly url: string
  readonly token: string
  readonly state: ServerState
  readonly client: Effect.Success<ReturnType<typeof makeClient>>
  readonly emit: (...paths: string[]) => void
}

export interface StartOptions {
  readonly files?: (dir: string) => Record<string, string>
  readonly git?: boolean
  readonly live?: boolean
  readonly origins?: ReadonlyArray<string>
  readonly appRoot?: (dir: string) => string
}

const fakeBackend = () => {
  const subs: Array<{ dir: string; onEvents: (events: Array<{ path: string }>) => void }> = []
  const backend: WatchBackend = {
    subscribe: async (dir, onEvents) => {
      const sub = { dir, onEvents }
      subs.push(sub)
      return {
        unsubscribe: async () => {
          subs.splice(subs.indexOf(sub), 1)
        },
      }
    },
  }
  const emit = (...paths: string[]) => {
    for (const sub of subs) {
      const mine = paths.filter((p) => p.startsWith(`${sub.dir}/`))
      if (mine.length > 0) sub.onEvents(mine.map((path) => ({ path })))
    }
  }
  return { backend, emit }
}

export const start = (options: StartOptions = {}): Effect.Effect<Running, unknown, Scope.Scope> =>
  Effect.gen(function* () {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-server-')))
    yield* Effect.addFinalizer(() =>
      Effect.sync(() => rmSync(dir, { recursive: true, force: true })),
    )
    for (const [path, text] of Object.entries((options.files ?? cleanWorkspaceFiles)(dir))) {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, text)
    }
    if (options.git) initGit(dir)
    const repo = yield* openRepo(dir)
    const repoGit = options.git ? yield* workspaceGit(repo.workspace) : undefined
    const createdBy = repoGit ? yield* gitHandle(repoGit) : undefined
    const state = yield* makeState(repo, {
      git: repoGit,
      createdBy,
      version: '9.9.9',
      ...(options.origins ? { origins: options.origins } : {}),
    })

    const fake = fakeBackend()
    if (options.live) {
      yield* startLive(state, { backend: fake.backend, debounceMs: 5, lintDebounceMs: 5 })
    }

    const running = yield* listen(state, {
      port: 0,
      ...(options.appRoot ? { appRoot: options.appRoot(dir) } : {}),
    })
    const url = running.url
    const client = yield* makeClient({ baseUrl: url, token: running.token }).pipe(
      Effect.provide(FetchHttpClient.layer),
    )
    return { dir, url, token: running.token, state, client, emit: fake.emit }
  }).pipe(Effect.provide(NodeServices.layer))

export const withServer = <A>(
  use: (running: Running) => Effect.Effect<A, unknown, Scope.Scope>,
  options: StartOptions = {},
) =>
  Effect.runPromise(
    Effect.scoped(Effect.flatMap(start(options), use)).pipe(Effect.provide(NodeServices.layer)),
  )

export const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

export const initGit = (dir: string) => {
  git(dir, 'init', '-q', '-b', 'main')
  git(dir, 'config', 'user.name', 'Ada Lovelace')
  git(dir, 'config', 'user.email', 'ada@example.com')
  git(dir, 'add', '-A')
  git(dir, 'commit', '-q', '-m', 'initial')
}

export const commitAll = (dir: string, message: string) => {
  git(dir, 'add', '-A')
  git(dir, 'commit', '-q', '-m', message)
}

export const raw = async (url: string, path: string, init?: RequestInit) => {
  const response = await fetch(`${url}${path}`, init)
  const text = await response.text()
  return { status: response.status, body: text === '' ? undefined : (JSON.parse(text) as any) }
}

export const makeTempState = async () => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-server-')))
  for (const [path, text] of Object.entries(cleanWorkspaceFiles(dir))) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
  }
  return Effect.runPromise(
    Effect.gen(function* () {
      const repo = yield* openRepo(dir)
      return yield* makeState(repo)
    }).pipe(Effect.provide(NodeServices.layer)),
  )
}
