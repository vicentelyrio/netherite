import { MantineProvider } from '@mantine/core'
import { type ReactNode, useEffect } from 'react'
import { theme } from './theme'

export interface NetheriteProviderProps {
  readonly children: ReactNode
  readonly root?: () => HTMLElement | null
  readonly env?: 'default' | 'test'
}

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

const iconFont = '20px "Material Symbols Rounded Variable"'
const iconTimeout = 4000

export const useIconsReady = () => {
  useEffect(() => {
    const root = document.documentElement
    const ready = () => root.setAttribute('data-nt-icons', 'ready')
    const fonts = document.fonts as FontFaceSet | undefined
    if (fonts === undefined) return ready()
    const timer = setTimeout(ready, iconTimeout)
    fonts
      .load(iconFont, 'search')
      .then(ready, ready)
      .finally(() => clearTimeout(timer))
    return () => clearTimeout(timer)
  }, [])
}
