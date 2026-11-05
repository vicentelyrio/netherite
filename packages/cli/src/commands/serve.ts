import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { gitHandle, openRepo, workspaceGit } from '@netherite/core'
import { createMcpHttp } from '@netherite/mcp'
import { listen, makeState, notifyChanged, startLive } from '@netherite/server'
import { Effect, type Layer, Path } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'
import { reportFailure } from '../errors'
import { type Env, type ExitCode, exitCodes } from '../output'

export interface ServeOptions {
  readonly dir: string
  /** The port asked for. Without it, 4747 or the next free one. */
  readonly port: number | undefined
  readonly noOpen: boolean
  /** A built app to serve instead of the one bundled with the package. */
  readonly app: string | undefined
  /** Do not watch for changes made outside the server. */
  readonly noWatch: boolean
  readonly version: string
}

/** The app bundled next to the program (see the release packaging), if there is one. */
const bundledApp = () => fileURLToPath(new URL('./app', import.meta.url))

/** Opens a page with the operating system's default browser. */
export const openInBrowser = (url: string) => {
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '""', url]]
        : ['xdg-open', [url]]
  const child = spawn(command as string, args as string[], { stdio: 'ignore', detached: true })
  child.on('error', () => {})
  child.unref()
}

const untilAborted = (signal: AbortSignal | undefined) =>
  Effect.promise(
    () =>
      new Promise<void>((resolve) => {
        if (signal === undefined) return
        if (signal.aborted) return resolve()
        signal.addEventListener('abort', () => resolve(), { once: true })
      }),
  )

/**
 * `netherite serve`: the app, the API, live updates and MCP over HTTP at `/mcp`, on loopback
 * (ADR-00010). Prints where it is and how to connect an agent; stops on Ctrl-C.
 */
export const serveCommand = (env: Env, options: ServeOptions) =>
  Effect.gen(function* () {
    const path = yield* Path.Path
    const run = Effect.scoped(
      Effect.gen(function* () {
        const repo = yield* openRepo(path.resolve(env.cwd, options.dir))
        const git = yield* workspaceGit(repo.workspace)
        const createdBy = yield* gitHandle(git)
        const state = yield* makeState(repo, { git, createdBy, version: options.version })

        const context = yield* Effect.context()
        const mcp = yield* createMcpHttp(repo, {
          git,
          createdBy,
          version: options.version,
          onWrite: (write) =>
            void Effect.runPromiseWith(context)(
              write.tool === 'delete'
                ? notifyChanged(state, [], [write.path])
                : notifyChanged(state, write.changed, []),
            ),
        })
        yield* Effect.addFinalizer(() => Effect.promise(() => mcp.close()))

        const mcpRoute = HttpRouter.add(
          '*',
          '/mcp',
          Effect.gen(function* () {
            const request = yield* HttpServerRequest.HttpServerRequest
            const web = yield* HttpServerRequest.toWeb(request)
            return HttpServerResponse.fromWeb(yield* Effect.promise(() => mcp.handle(web)))
          }),
        )

        if (!options.noWatch) {
          const live = yield* Effect.result(startLive(state))
          if (live._tag === 'Failure') {
            env.out.error(`Not watching for outside changes: ${(live.failure as Error).message}`)
          }
        } else {
          yield* startLive(state, { watch: false })
        }

        const running = yield* listen(state, {
          ...(options.port === undefined ? { port: 4747, fallback: true } : { port: options.port }),
          appRoot: options.app ?? bundledApp(),
          routes: mcpRoute as Layer.Layer<never, never, HttpRouter.HttpRouter>,
        })

        env.out.line(`Netherite is running at ${running.url}  (${repo.workspace.root})`)
        env.out.line('')
        env.out.line('Connect an agent over HTTP:')
        env.out.line(
          `  claude mcp add --transport http netherite ${running.url}/mcp --header "Authorization: Bearer ${running.token}"`,
        )
        env.out.line('Or over stdio, which needs no token:  netherite mcp')
        env.out.line('The token is for this session only. Press Ctrl-C to stop.')

        if (!options.noOpen) (env.serve?.open ?? openInBrowser)(running.url)
        yield* untilAborted(env.serve?.signal)
        env.out.line('Stopped.')
        return exitCodes.ok as ExitCode
      }),
    )
    return yield* Effect.catch(run, (error) => Effect.succeed(reportFailure(env, error)))
  })
