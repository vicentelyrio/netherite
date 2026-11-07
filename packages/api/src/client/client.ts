import { HttpClient, HttpClientRequest } from 'effect/http'
import { HttpApiClient } from 'effect/http-api'
import { NetheriteApi } from '../api'

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
