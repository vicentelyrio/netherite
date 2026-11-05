import { NetheriteProvider } from '@netherite/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type RouterHistory, RouterProvider } from '@tanstack/react-router'
import { useMemo } from 'react'
import { ApiProvider, createApi } from '@/infrastructure/api'
import type { AppConfig } from '@/infrastructure/config'
import { I18nProvider } from '@/infrastructure/i18n'
import { NoticeProvider } from '@/infrastructure/notices'
import { SettingsProvider } from '@/infrastructure/settings'
import { createAppRouter } from './router'

export interface AppProps {
  readonly config: AppConfig
  readonly history?: RouterHistory
  readonly env?: 'default' | 'test'
}

export function App({ config, history, env }: AppProps) {
  const api = useMemo(() => createApi(config), [config])
  const client = useMemo(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
      }),
    [],
  )
  const router = useMemo(() => createAppRouter(history), [history])
  return (
    <NetheriteProvider {...(env === undefined ? {} : { env })}>
      <I18nProvider>
        <ApiProvider value={api}>
          <QueryClientProvider client={client}>
            <SettingsProvider>
              <NoticeProvider>
                <RouterProvider router={router} />
              </NoticeProvider>
            </SettingsProvider>
          </QueryClientProvider>
        </ApiProvider>
      </I18nProvider>
    </NetheriteProvider>
  )
}
