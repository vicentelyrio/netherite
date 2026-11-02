import { NetheriteProvider } from '@netherite/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type RouterHistory, RouterProvider } from '@tanstack/react-router'
import { useMemo } from 'react'
import { createApi } from './lib/api'
import { ApiProvider } from './lib/app-context'
import type { AppConfig } from './lib/config'
import { NoticeProvider } from './lib/notices'
import { createAppRouter } from './router'

export interface AppProps {
  readonly config: AppConfig
  /** A memory history for tests; the browser's by default. */
  readonly history?: RouterHistory
  /** `test` turns off the component library's transitions and portals. */
  readonly env?: 'default' | 'test'
}

/** The whole app: theme, server client, queries, messages and routes. */
export function App({ config, history, env }: AppProps) {
  const api = useMemo(() => createApi(config), [config])
  // The event stream keeps queries fresh, so they can be trusted for a while.
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
      <ApiProvider value={api}>
        <QueryClientProvider client={client}>
          <NoticeProvider>
            <RouterProvider router={router} />
          </NoticeProvider>
        </QueryClientProvider>
      </ApiProvider>
    </NetheriteProvider>
  )
}
