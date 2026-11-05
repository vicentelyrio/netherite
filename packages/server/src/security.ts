import { randomBytes, timingSafeEqual } from 'node:crypto'
import { Effect } from 'effect'
import { HttpMiddleware, HttpServerRequest, HttpServerResponse } from 'effect/http'

/**
 * How the local server defends itself (ADR-00010). It listens on loopback only, but a web page
 * in the user's browser can still send requests to `127.0.0.1`, and DNS rebinding can make a
 * hostile name resolve to it. So every request is checked:
 *
 * 1. `Host` must be the server's own address, which defeats DNS rebinding (a rebound request
 *    arrives with `Host: evil.example`).
 * 2. `Origin`, when the browser sends one, must be the server's own origin (or one listed in
 *    `origins`, such as the Vite dev server).
 * 3. `Sec-Fetch-Site: cross-site` is refused even without an `Origin`.
 * 4. Anything that can change data (POST, PUT, PATCH, DELETE) must carry the per-session token.
 *
 * No CORS headers are ever sent, so browsers will not let other origins read responses either.
 */
export interface Policy {
  /** The secret handed to the app at startup. Writes need it. */
  readonly token: string
  /** The port actually listening (known only after the server starts). */
  readonly port: () => number
  /** Extra origins allowed to call the API, such as `http://localhost:5173` in development. */
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

/** The `Host` values that mean this server. */
export const allowedHosts = (port: number) => loopbackNames.map((name) => `${name}:${port}`)

/** The origins that mean this server. */
export const allowedOrigins = (port: number) => allowedHosts(port).map((host) => `http://${host}`)

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Is this a loopback address: `localhost`, `::1`, or anything in `127.0.0.0/8`? */
export const isLoopbackHost = (host: string) =>
  host === 'localhost' ||
  host === '::1' ||
  host === '[::1]' ||
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)

/** A fresh random token: 256 bits, hex. */
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

/** Decides whether a request may proceed. Pure, so it can be tested without a server. */
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

/** The check as server middleware: a refused request never reaches the API. */
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
