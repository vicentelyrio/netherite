import { MantineProvider } from '@mantine/core'
import { type ReactNode, useEffect } from 'react'
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
  useIconsReady()
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

/** The icon font, loaded by name; icons are hidden until it is, or after this long. */
const iconFont = '20px "Material Symbols Rounded Variable"'
const iconTimeout = 4000

/**
 * Icons are ligatures: until the icon font arrives, a browser would show the icon's name as text
 * ("search"). So icons stay hidden until the font is ready (see `fonts.css`), and show anyway
 * after a few seconds, in case it never comes.
 */
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
