import { checkPath, checkRatio, checkStrokeWidth, checkViewBox } from './StatusGlyph.constants'

export function StatusGlyphCheck({ size }: { readonly size: number }) {
  const side = Math.round(size * checkRatio)
  return (
    <svg width={side} height={side} viewBox={checkViewBox} aria-hidden="true">
      <path
        d={checkPath}
        fill="none"
        stroke="var(--nt-color-bg-shell)"
        strokeWidth={checkStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
