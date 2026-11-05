import { createServer } from 'node:http'
import { NodeHttpServer } from '@effect/platform-node'
import { Data, Effect, Layer, type Scope } from 'effect'
import { HttpRouter, HttpServer, type HttpServerError } from 'effect/http'
import { appRoutes } from './app'
import { apiLayer } from './handlers'
import { guard, isLoopbackHost } from './security'
import type { ServerState } from './state'

/** The server was asked to listen on an address other than loopback. */
export class NotLoopback extends Data.TaggedError('NotLoopback')<{ readonly host: string }> {
  override get message() {
    return `Refusing to listen on "${this.host}": the Netherite server only listens on loopback (127.0.0.1) because it can write to your files.`
  }
}

/** The port asked for is taken (and no fallback was allowed, or every fallback is taken too). */
export class PortInUse extends Data.TaggedError('PortInUse')<{
  readonly port: number
  readonly lastPort: number
}> {
  override get message() {
    return this.lastPort === this.port
      ? `Port ${this.port} is already in use. Pick another with --port, or stop what is using it.`
      : `Ports ${this.port} to ${this.lastPort} are all in use. Pick another with --port.`
  }
}

export interface ListenOptions {
  /** Default `127.0.0.1`. Only loopback addresses are accepted. */
  readonly host?: string
  /** Default 4747. `0` picks any free port. */
  readonly port?: number
  /**
   * When the port is taken, try the next ones (up to 50) instead of failing. Use it for the
   * default port; a port the user asked for should fail loudly. Default `false`.
   */
  readonly fallback?: boolean
  /** The folder with the built app (`index.html` and assets). Without it a placeholder page is served. */
  readonly appRoot?: string | undefined
  /**
   * More routes behind the same Host, Origin and token checks, such as MCP at `/mcp`. They are
   * added next to the API and the app.
   */
  readonly routes?: Layer.Layer<never, never, HttpRouter.HttpRouter>
}

export interface Running {
  readonly url: string
  readonly port: number
  /** The secret the app sends with every write. Never log it. */
  readonly token: string
}

const inUse = (error: unknown): boolean => {
  const text =
    error instanceof Error
      ? `${error.message} ${String((error as { cause?: unknown }).cause)}`
      : String(error)
  const cause = (error as { cause?: { code?: string } }).cause
  return cause?.code === 'EADDRINUSE' || text.includes('EADDRINUSE')
}

/**
 * Starts the API and the app on loopback, behind the Host, Origin and token checks (ADR-00010).
 * Stops when the scope closes.
 */
export const listen = (
  state: ServerState,
  options: ListenOptions = {},
): Effect.Effect<
  Running,
  NotLoopback | unknown,
  Scope.Scope | import('effect').FileSystem.FileSystem | import('effect').Path.Path
> =>
  Effect.gen(function* () {
    const host = options.host ?? '127.0.0.1'
    if (!isLoopbackHost(host)) return yield* new NotLoopback({ host })

    const first = options.port ?? 4747
    const last = options.fallback && first !== 0 ? Math.min(first + 49, 65535) : first
    let port = first
    const app = Layer.mergeAll(
      apiLayer(state),
      appRoutes(state, options.appRoot),
      options.routes ?? Layer.empty,
    )

    let lastError: HttpServerError.ServeError | undefined
    for (let candidate = first; candidate <= last; candidate++) {
      port = candidate
      const http = NodeHttpServer.layer(() => createServer(), { port: candidate, host })
      const served = HttpRouter.serve(app, {
        middleware: guard({ token: state.token, port: () => port, origins: state.origins }),
        disableListenLog: true,
        // Quiet by default: the command prints what a person needs.
        disableLogger: true,
      }).pipe(Layer.provideMerge(http))
      const built = yield* Effect.result(Layer.build(served))
      if (built._tag === 'Failure') {
        lastError = built.failure
        if (inUse(built.failure)) {
          if (candidate < last) continue
          return yield* new PortInUse({ port: first, lastPort: last })
        }
        return yield* Effect.fail(built.failure)
      }
      const address = Effect.runSync(
        Effect.service(HttpServer.HttpServer).pipe(
          Effect.provideContext(built.success),
          Effect.map((server) => server.address),
        ),
      )
      if (address._tag === 'UnixPathAddress') return yield* Effect.die('expected a TCP address')
      port = address.port
      return { url: `http://127.0.0.1:${port}`, port, token: state.token } satisfies Running
    }
    return yield* Effect.die(lastError)
  })
