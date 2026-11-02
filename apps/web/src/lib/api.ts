import { makeClient } from '@netherite/api'
import { Effect } from 'effect'
import { FetchHttpClient } from 'effect/http'
import type { AppConfig } from './config'

type Client = Effect.Success<ReturnType<typeof makeClient>>

export interface Api {
  /**
   * Runs one call. A failure is thrown as the API's own tagged error (`Conflict`, `Invalid`,
   * `NotFound`…), so callers can tell what went wrong.
   */
  readonly call: <A, E>(use: (client: Client) => Effect.Effect<A, E>) => Promise<A>
  readonly config: AppConfig
}

/** The typed client for the local server, ready to use from React Query. */
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
