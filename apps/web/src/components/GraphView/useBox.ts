import { type RefObject, useEffect, useState } from 'react'
import { initialBox } from './GraphView.constants'

export const useBox = (wrap: RefObject<HTMLDivElement | null>) => {
  const [box, setBox] = useState<{ width: number; height: number }>(initialBox)
  useEffect(() => {
    const el = wrap.current
    if (el === null || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) {
        setBox((b) =>
          Math.abs(b.width - width) < 1 && Math.abs(b.height - height) < 1 ? b : { width, height },
        )
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [wrap])
  return box
}
