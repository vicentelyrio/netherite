import { MantineProvider } from '@mantine/core'
import type { ReactNode } from 'react'
import { theme } from './theme'

export interface NetheriteProviderProps {
  readonly children: ReactNode
  /** Where the colour scheme attribute goes. Default: the page's root element. */
  readonly root?: () => HTMLElement | null
}

/**
 * Wraps the app: the library's provider with Netherite's theme. The design is dark only, so the
 * scheme is fixed. Import the stylesheet once with `import '@netherite/ui/styles.css'`.
 */
export function NetheriteProvider({ children, root }: NetheriteProviderProps) {
  return (
    <MantineProvider
      theme={theme}
      forceColorScheme="dark"
      {...(root === undefined ? {} : { getRootElement: () => root() ?? undefined })}
    >
      {children}
    </MantineProvider>
  )
}
