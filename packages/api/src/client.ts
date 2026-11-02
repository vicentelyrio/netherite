import { HttpApiClient } from 'effect/http-api'
import { NetheriteApi } from './api'

/**
 * A typed client for the local server. Needs an `HttpClient` in its context (in the browser,
 * `FetchHttpClient.layer`). Pass `baseUrl` when the page is not served by the same server.
 */
export const makeClient = (options: { readonly baseUrl?: string | URL } = {}) =>
  HttpApiClient.make(NetheriteApi, options)
