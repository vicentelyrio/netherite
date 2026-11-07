import { NetheriteProvider } from '@netherite/ui'
import { type ReactNode, useLayoutEffect } from 'react'
import { useTheme } from './useTheme'

export function ThemedProvider({
  env,
  children,
}: {
  readonly env?: 'default' | 'test' | undefined
  readonly children: ReactNode
}) {
  const { theme } = useTheme()
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme.id
  }, [theme.id])
  return (
    <NetheriteProvider colorScheme={theme.scheme} {...(env === undefined ? {} : { env })}>
      {children}
    </NetheriteProvider>
  )
}
