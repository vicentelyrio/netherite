import type { CSSProperties } from 'react'
import { countRatio, insetRatio, minInset, minText, textRatio } from './ProgressRing.constants'

export const ringMetrics = (size: number) => {
  const text = Math.max(minText, Math.round(size * textRatio))
  return {
    inset: Math.max(minInset, Math.round(size * insetRatio)),
    text,
    count: Math.round(text * countRatio),
  }
}

export const ringStyle = (size: number, percent: number): CSSProperties => ({
  width: size,
  height: size,
  background: `conic-gradient(var(--nt-color-status-success) 0 ${percent}%, var(--nt-color-bg-track) 0)`,
})
