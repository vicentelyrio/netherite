import { makeClient } from '@netherite/api'
import { Effect } from 'effect'
import { FetchHttpClient } from 'effect/http'
import type { AppConfig } from '../config'

export type Client = Effect.Success<ReturnType<typeof makeClient>>

export interface Api {
  readonly call: <A, E>(use: (client: Client) => Effect.Effect<A, E>) => Promise<A>
  readonly config: AppConfig
}

export const createApi = (config: AppConfig): Api => {
  const client = Effect.runPromise(
    makeClient({
      baseUrl: config.baseUrl,
      ...(config.token === undefined ? {} : { token: config.token }),
    }).pipe(Effect.provide(FetchHttpClient.layer)),
  )
  return {
    config,
    call: async (use) => {
      const result = await Effect.runPromise(Effect.result(use(await client)))
      if (result._tag === 'Failure') throw result.failure
      return result.success
    },
  }
}
