import { randomBytes, timingSafeEqual } from 'node:crypto'
import { Effect } from 'effect'
import { HttpMiddleware, HttpServerRequest, HttpServerResponse } from 'effect/http'

export interface Policy {
  readonly token: string
  readonly port: () => number
  readonly origins: ReadonlyArray<string>
}

export type Verdict =
  | { readonly ok: true }
  | {
      readonly ok: false
      readonly status: 401 | 403
      readonly error: 'Forbidden' | 'Unauthorized'
      readonly message: string
    }

const loopbackNames = ['127.0.0.1', 'localhost', '[::1]'] as const

export const allowedHosts = (port: number) => loopbackNames.map((name) => `${name}:${port}`)

export const allowedOrigins = (port: number) => allowedHosts(port).map((host) => `http://${host}`)

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

export const isLoopbackHost = (host: string) =>
  host === 'localhost' ||
  host === '::1' ||
  host === '[::1]' ||
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)

export const newToken = () => randomBytes(32).toString('hex')

const sameToken = (given: string, token: string) => {
  const a = Buffer.from(given)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

const tokenOf = (headers: Readonly<Record<string, string | undefined>>) => {
  const auth = headers.authorization
  if (auth !== undefined && /^Bearer /i.test(auth)) return auth.slice(7).trim()
  return headers['x-netherite-token']
}

const forbidden = (message: string): Verdict => ({
  ok: false,
  status: 403,
  error: 'Forbidden',
  message,
})

export const check = (
  request: {
    readonly method: string
    readonly headers: Readonly<Record<string, string | undefined>>
  },
  policy: Policy,
): Verdict => {
  const { headers } = request
  const port = policy.port()

  const host = headers.host
  if (host === undefined || !allowedHosts(port).includes(host.toLowerCase())) {
    return forbidden('This server only answers requests addressed to its own loopback address.')
  }

  const origin = headers.origin
  if (
    origin !== undefined &&
    !allowedOrigins(port).includes(origin) &&
    !policy.origins.includes(origin)
  ) {
    return forbidden('Requests from other origins are not allowed.')
  }
  if (
    headers['sec-fetch-site'] === 'cross-site' &&
    (origin === undefined || !policy.origins.includes(origin))
  ) {
    return forbidden('Cross-site requests are not allowed.')
  }

  if (!safeMethods.has(request.method.toUpperCase())) {
    const given = tokenOf(headers)
    if (given === undefined) {
      return {
        ok: false,
        status: 401,
        error: 'Unauthorized',
        message: 'Writes need the session token.',
      }
    }
    if (!sameToken(given, policy.token)) {
      return {
        ok: false,
        status: 401,
        error: 'Unauthorized',
        message: 'The session token is not valid.',
      }
    }
  }
  return { ok: true }
}

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
