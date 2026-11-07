import { createServer } from 'node:http'
import { NodeHttpServer } from '@effect/platform-node'
import { Effect, type FileSystem, Layer, type Path, type Scope } from 'effect'
import { HttpRouter, HttpServer } from 'effect/http'
import { appRoutes } from '../app'
import { loopbackHost, urlOf } from '../constants'
import { apiLayer } from '../handlers'
import { guard, isLoopbackHost } from '../security'
import type { ServerState } from '../state'
import { isAddressInUse } from './isAddressInUse'
import { portRange } from './portRange'
import { NotLoopback, PortInUse } from './serve.errors'
import type { ListenOptions, Running } from './serve.types'

const unixAddress = 'UnixPathAddress'

export const listen = (
  state: ServerState,
  options: ListenOptions = {},
): Effect.Effect<Running, NotLoopback | unknown, Scope.Scope | FileSystem.FileSystem | Path.Path> =>
  Effect.gen(function* () {
    const host = options.host ?? loopbackHost
    if (!isLoopbackHost(host)) return yield* new NotLoopback({ host })

    const { first, last } = portRange(options.port, options.fallback)
    let port = first
    const app = Layer.mergeAll(
      apiLayer(state),
      appRoutes(state, options.appRoot),
      options.routes ?? Layer.empty,
    )

    for (let candidate = first; candidate <= last; candidate++) {
      port = candidate
      const http = NodeHttpServer.layer(() => createServer(), { port: candidate, host })
      const served = HttpRouter.serve(app, {
        middleware: guard({ token: state.token, port: () => port, origins: state.origins }),
        disableListenLog: true,
        disableLogger: true,
      }).pipe(Layer.provideMerge(http))
      const built = yield* Effect.result(Layer.build(served))
      if (built._tag === 'Failure') {
        if (!isAddressInUse(built.failure)) return yield* Effect.fail(built.failure)
        continue
      }
      const address = Effect.runSync(
        Effect.service(HttpServer.HttpServer).pipe(
          Effect.provideContext(built.success),
          Effect.map((server) => server.address),
        ),
      )
      if (address._tag === unixAddress) return yield* Effect.die('expected a TCP address')
      port = address.port
      return { url: urlOf(loopbackHost, port), port, token: state.token } satisfies Running
    }
    return yield* new PortInUse({ port: first, lastPort: last })
  })
