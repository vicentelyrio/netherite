import { randomBytes, timingSafeEqual } from 'node:crypto'
import { bearerPrefix, Header, tokenBytes } from '../constants'
import type { GuardedRequest } from './security.types'

const bearer = new RegExp(`^${bearerPrefix}`, 'i')

export const newToken = () => randomBytes(tokenBytes).toString('hex')

export const sameToken = (given: string, token: string) => {
  const a = Buffer.from(given)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

export const tokenOf = (headers: GuardedRequest['headers']) => {
  const auth = headers[Header.Authorization]
  if (auth !== undefined && bearer.test(auth)) return auth.slice(bearerPrefix.length).trim()
  return headers[Header.NetheriteToken]
}
