import { MantineProvider } from '@mantine/core'
import { theme } from '../../theme'
import type { NetheriteProviderProps } from './NetheriteProvider.types'
import { useIconsReady } from './useIconsReady'

export function NetheriteProvider({ children, root, env }: NetheriteProviderProps) {
  useIconsReady()
  return (
    <MantineProvider
      theme={theme}
      forceColorScheme="dark"
      {...(env === undefined ? {} : { env })}
      {...(root === undefined ? {} : { getRootElement: () => root() ?? undefined })}
    >
      {children}
    </MantineProvider>
  )
}
