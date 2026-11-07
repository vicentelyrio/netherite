import { NetheriteApi } from '@netherite/api'
import { Effect, PubSub, Stream } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import type { ServerState } from '../state'

export const events = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'events', (handlers) =>
    handlers.handle('events', () =>
      Effect.succeed(
        Stream.unwrap(
          Effect.gen(function* () {
            const subscription = yield* PubSub.subscribe(state.events)
            const ping = Stream.tick('25 seconds').pipe(
              Stream.drop(1),
              Stream.map(() => ({ type: 'ping' as const })),
            )
            return Stream.make({ type: 'ready' as const, version: state.version }).pipe(
              Stream.concat(Stream.merge(Stream.fromSubscription(subscription), ping)),
            )
          }),
        ),
      ),
    ),
  )
