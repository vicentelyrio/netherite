import { useEffect } from 'react'

const iconFont = '20px "Material Symbols Rounded Variable"'
const iconSample = 'search'
const iconTimeout = 4000

export const useIconsReady = () => {
  useEffect(() => {
    const root = document.documentElement
    const ready = () => root.setAttribute('data-nt-icons', 'ready')
    const fonts = document.fonts as FontFaceSet | undefined
    if (fonts === undefined) return ready()
    const timer = setTimeout(ready, iconTimeout)
    fonts
      .load(iconFont, iconSample)
      .then(ready, ready)
      .finally(() => clearTimeout(timer))
    return () => clearTimeout(timer)
  }, [])
}
