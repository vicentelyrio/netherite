import { Effect } from 'effect'
import { HttpMiddleware, HttpServerRequest, HttpServerResponse } from 'effect/http'
import { check } from './check'
import type { Policy } from './security.types'

export const guard = (policy: Policy) =>
  HttpMiddleware.make((app) =>
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const verdict = check(request, policy)
      if (verdict.ok) return yield* app
      return HttpServerResponse.jsonUnsafe(
        { _tag: verdict.error, message: verdict.message },
        { status: verdict.status },
      )
    }),
  )
