import { CacheControl, Header } from '../constants'

const nosniff = 'nosniff'

const contentSecurityPolicy =
  "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"

export const pageHeaders = {
  [Header.CacheControl]: CacheControl.None,
  [Header.ContentTypeOptions]: nosniff,
  [Header.ReferrerPolicy]: 'no-referrer',
  [Header.ContentSecurityPolicy]: contentSecurityPolicy,
}

export const assetHeaders = (forever: boolean) => ({
  [Header.ContentTypeOptions]: nosniff,
  [Header.CacheControl]: forever ? CacheControl.Forever : CacheControl.Revalidate,
})
