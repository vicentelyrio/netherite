export const HttpStatus = {
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
} as const

export const HttpMethod = { Get: 'GET', Head: 'HEAD', Options: 'OPTIONS' } as const

export const safeMethods: ReadonlySet<string> = new Set(Object.values(HttpMethod))

export const Header = {
  Authorization: 'authorization',
  CacheControl: 'cache-control',
  ContentSecurityPolicy: 'content-security-policy',
  ContentTypeOptions: 'x-content-type-options',
  Host: 'host',
  NetheriteToken: 'x-netherite-token',
  Origin: 'origin',
  ReferrerPolicy: 'referrer-policy',
  SecFetchSite: 'sec-fetch-site',
} as const

export const CacheControl = {
  None: 'no-store',
  Revalidate: 'no-cache',
  Forever: 'public, max-age=31536000, immutable',
} as const
