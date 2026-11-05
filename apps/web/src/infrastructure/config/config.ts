export interface AppConfig {
  readonly baseUrl: string
  readonly token: string | undefined
}

const meta = (name: string) =>
  document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content || undefined

export const readConfig = (): AppConfig => ({
  baseUrl: window.location.origin,
  token: meta('netherite-token'),
})
