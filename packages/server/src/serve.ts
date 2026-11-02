import { createServer } from 'node:http'
import { NodeHttpServer } from '@effect/platform-node'
import { Data, Effect, Layer } from 'effect'
import { HttpRouter, HttpServer } from 'effect/http'
import { apiLayer } from './handlers'
import { guard, isLoopbackHost } from './security'
import type { ServerState } from './state'

/** The server was asked to listen on an address other than loopback. */
export class NotLoopback extends Data.TaggedError('NotLoopback')<{ readonly host: string }> {
  override get message() {
    return `Refusing to listen on "${this.host}": the Netherite server only listens on loopback (127.0.0.1) because it can write to your files.`
  }
}

export interface ListenOptions {
  /** Default `127.0.0.1`. Only loopback addresses are accepted. */
  readonly host?: string
  /** Default 4747. `0` picks any free port. */
  readonly port?: number
}

export interface Running {
  readonly url: string
  readonly port: number
  /** The secret the app sends with every write. Never log it. */
  readonly token: string
}

/**
 * Starts the API on loopback, behind the Host, Origin and token checks (ADR-00010). Stops when
 * the scope closes.
 */
export const listen = (state: ServerState, options: ListenOptions = {}) =>
  Effect.gen(function* () {
    const host = options.host ?? '127.0.0.1'
    if (!isLoopbackHost(host)) return yield* new NotLoopback({ host })

    let port = options.port ?? 4747
    const http = NodeHttpServer.layer(() => createServer(), { port, host })
    const app = HttpRouter.serve(apiLayer(state), {
      middleware: guard({ token: state.token, port: () => port, origins: state.origins }),
      disableListenLog: true,
    }).pipe(Layer.provideMerge(http))
    const context = yield* Layer.build(app)
    const address = Effect.runSync(
      Effect.service(HttpServer.HttpServer).pipe(
        Effect.provideContext(context),
        Effect.map((server) => server.address),
      ),
    )
    if (address._tag === 'UnixPathAddress') return yield* Effect.die('expected a TCP address')
    port = address.port
    return { url: `http://127.0.0.1:${port}`, port, token: state.token } satisfies Running
  })
