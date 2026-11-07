import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type RouterHistory, RouterProvider } from '@tanstack/react-router'
import { useMemo } from 'react'
import { ApiProvider, createApi } from '@/infrastructure/api'
import type { AppConfig } from '@/infrastructure/config'
import { NoticeProvider } from '@/infrastructure/notices'
import { LocalizedProvider, SettingsProvider, ThemedProvider } from '@/infrastructure/settings'
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
    <SettingsProvider>
      <ThemedProvider env={env}>
        <LocalizedProvider>
          <ApiProvider value={api}>
            <QueryClientProvider client={client}>
              <NoticeProvider>
                <RouterProvider router={router} />
              </NoticeProvider>
            </QueryClientProvider>
          </ApiProvider>
        </LocalizedProvider>
      </ThemedProvider>
    </SettingsProvider>
  )
}
