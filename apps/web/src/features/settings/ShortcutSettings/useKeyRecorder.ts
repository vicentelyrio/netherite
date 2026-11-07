import { useEffect, useRef } from 'react'
import { comboFromEvent } from '@/infrastructure/shortcuts'

export const useKeyRecorder = (
  active: boolean,
  onKeys: (keys: string) => void,
  onCancel: () => void,
) => {
  const latest = useRef({ onKeys, onCancel })
  latest.current = { onKeys, onCancel }
  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') return latest.current.onCancel()
      event.preventDefault()
      event.stopImmediatePropagation()
      if (event.key === 'Escape') return latest.current.onCancel()
      const keys = comboFromEvent(event)
      if (keys !== undefined) latest.current.onKeys(keys)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [active])
}
