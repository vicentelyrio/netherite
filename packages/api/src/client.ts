import { HttpClient, HttpClientRequest } from 'effect/http'
import { HttpApiClient } from 'effect/http-api'
import { NetheriteApi } from './api'

/**
 * A typed client for the local server. Needs an `HttpClient` in its context (in the browser,
 * `FetchHttpClient.layer`). Pass `baseUrl` when the page is not served by the same server, and
 * `token` (the session token the server handed to the app) so writes are accepted.
 */
export const makeClient = (
  options: { readonly baseUrl?: string | URL; readonly token?: string } = {},
) =>
  HttpApiClient.make(NetheriteApi, {
    ...(options.baseUrl === undefined ? {} : { baseUrl: options.baseUrl }),
    ...(options.token === undefined
      ? {}
      : {
          transformClient: HttpClient.mapRequest(
            HttpClientRequest.setHeader('x-netherite-token', options.token),
          ),
        }),
  })
