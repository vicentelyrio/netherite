/** What the app needs to reach the server it was served from. */
export interface AppConfig {
  /** Where the API is. Default: the page's own origin. */
  readonly baseUrl: string
  /** The session token the server put in the page. Writes need it. */
  readonly token: string | undefined
}

const meta = (name: string) =>
  document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content || undefined

/**
 * Reads the session from the page: the server puts its token in a `<meta>` tag when it serves
 * `index.html`, so the token is never in a URL (ADR-00010).
 */
export const readConfig = (): AppConfig => ({
  baseUrl: window.location.origin,
  token: meta('netherite-token'),
})
