import { type StatusName, statusGlyph } from '@netherite/tokens'
import type { CSSProperties } from 'react'

const clamp = (value: number) => Math.min(1, Math.max(0, value))

export interface GlyphLook {
  readonly status: StatusName
  readonly color: string
  readonly progress: number
  readonly size: number
  readonly dimDone: boolean | undefined
}

export const statusGlyphStyle = ({
  status,
  color,
  progress,
  size,
  dimDone,
}: GlyphLook): CSSProperties => {
  const ring =
    size >= statusGlyph.thickFrom ? 'var(--nt-status-ring-thick)' : 'var(--nt-status-ring-thin)'
  const percent = Math.round(clamp(progress) * 100)
  const fill = status === 'hold' ? 'var(--nt-status-hold)' : color
  const track = `color-mix(in srgb, ${color} var(--nt-status-track-share), transparent)`
  return {
    width: size,
    height: size,
    background: status === 'done' ? color : `conic-gradient(${fill} 0 ${percent}%, ${track} 0)`,
    border:
      status === 'done' ? 'none' : `${ring} ${status === 'hold' ? 'dashed' : 'solid'} ${color}`,
    boxShadow:
      status === 'progress'
        ? `0 0 0 var(--nt-status-halo-gap) var(--nt-color-bg-canvas), 0 0 0 calc(var(--nt-status-halo-gap) + var(--nt-status-halo-width)) ${color}`
        : 'none',
    opacity: status === 'done' && dimDone ? 'var(--nt-status-done-opacity)' : 1,
  }
}
