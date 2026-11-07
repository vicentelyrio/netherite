import { Header, HttpStatus, safeMethods } from '../constants'
import { allowedHosts, allowedOrigins } from './loopback'
import { SecurityMessage } from './messages'
import { type GuardedRequest, type Policy, type Verdict, VerdictError } from './security.types'
import { sameToken, tokenOf } from './token'

const crossSite = 'cross-site'

const forbidden = (message: string): Verdict => ({
  ok: false,
  status: HttpStatus.Forbidden,
  error: VerdictError.Forbidden,
  message,
})

const unauthorized = (message: string): Verdict => ({
  ok: false,
  status: HttpStatus.Unauthorized,
  error: VerdictError.Unauthorized,
  message,
})

type Rule = (request: GuardedRequest, policy: Policy) => Verdict | undefined

const rules: ReadonlyArray<Rule> = [
  ({ headers }, policy) => {
    const host = headers[Header.Host]
    return host !== undefined && allowedHosts(policy.port()).includes(host.toLowerCase())
      ? undefined
      : forbidden(SecurityMessage.WrongHost)
  },
  ({ headers }, policy) => {
    const origin = headers[Header.Origin]
    return origin === undefined ||
      allowedOrigins(policy.port()).includes(origin) ||
      policy.origins.includes(origin)
      ? undefined
      : forbidden(SecurityMessage.WrongOrigin)
  },
  ({ headers }, policy) => {
    const origin = headers[Header.Origin]
    return headers[Header.SecFetchSite] === crossSite &&
      (origin === undefined || !policy.origins.includes(origin))
      ? forbidden(SecurityMessage.CrossSite)
      : undefined
  },
  ({ method, headers }, policy) => {
    if (safeMethods.has(method.toUpperCase())) return undefined
    const given = tokenOf(headers)
    if (given === undefined) return unauthorized(SecurityMessage.NoToken)
    return sameToken(given, policy.token) ? undefined : unauthorized(SecurityMessage.BadToken)
  },
]

export const check = (request: GuardedRequest, policy: Policy): Verdict => {
  for (const rule of rules) {
    const verdict = rule(request, policy)
    if (verdict !== undefined) return verdict
  }
  return { ok: true }
}
