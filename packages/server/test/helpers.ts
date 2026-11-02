import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { devNull, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { NodeHttpServer, NodeServices } from '@effect/platform-node'
import { makeClient } from '@netherite/api'
import { gitHandle, openRepo, workspaceGit } from '@netherite/core'
import { cleanWorkspaceFiles } from '@netherite/testing'
import { Effect, Layer, type Scope } from 'effect'
import { FetchHttpClient, HttpRouter, HttpServer } from 'effect/http'
import { apiLayer, makeState, type ServerState } from '../src/index'

export const isolateGit = () => {
  process.env.GIT_CONFIG_GLOBAL = devNull
  process.env.GIT_CONFIG_SYSTEM = devNull
}

export interface Running {
  readonly dir: string
  readonly url: string
  readonly state: ServerState
  readonly client: Effect.Success<ReturnType<typeof makeClient>>
}

export interface StartOptions {
  readonly files?: (dir: string) => Record<string, string>
  readonly git?: boolean
}

/**
 * A temporary workspace with the API served on a free port, and a typed client for it. Everything
 * is torn down when the scope closes.
 */
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
    const state = yield* makeState(repo, { git: repoGit, createdBy, version: '9.9.9' })

    const http = NodeHttpServer.layer(() => createServer(), { port: 0, host: '127.0.0.1' })
    const served = HttpRouter.serve(apiLayer(state)).pipe(Layer.provideMerge(http))
    const context = yield* Layer.build(served)
    const server = Effect.runSync(
      Effect.service(HttpServer.HttpServer).pipe(Effect.provideContext(context)),
    )
    const address = server.address
    if (address._tag === 'UnixPathAddress') throw new Error('expected a TCP address')
    const url = `http://127.0.0.1:${address.port}`
    const client = yield* makeClient({ baseUrl: url }).pipe(Effect.provide(FetchHttpClient.layer))
    return { dir, url, state, client }
  }).pipe(Effect.provide(NodeServices.layer))

/** Runs a test body against a running server, then shuts it down. */
export const withServer = <A>(
  use: (running: Running) => Effect.Effect<A, unknown, never>,
  options: StartOptions = {},
) =>
  Effect.runPromise(
    Effect.scoped(Effect.flatMap(start(options), use)).pipe(Effect.provide(NodeServices.layer)),
  )

export const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

/** Makes the folder a git repository with everything in it committed. */
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

/** A plain `fetch` against the server, for checking status codes and raw bodies. */
export const raw = async (url: string, path: string, init?: RequestInit) => {
  const response = await fetch(`${url}${path}`, init)
  const text = await response.text()
  return { status: response.status, body: text === '' ? undefined : (JSON.parse(text) as any) }
}
