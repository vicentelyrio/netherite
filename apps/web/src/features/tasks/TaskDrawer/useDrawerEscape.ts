import { isFieldFocused } from '@/infrastructure/sections'
import { overlaySelector, useShortcuts } from '@/infrastructure/shortcuts'

const closeKey = 'escape'

export const useDrawerEscape = (opened: boolean, onClose: () => void) =>
  useShortcuts(
    {
      [closeKey]: () => {
        if (isFieldFocused() || document.querySelectorAll(overlaySelector).length > 1) return false
        onClose()
        return true
      },
    },
    { layer: 'overlay', enabled: opened },
  )
