import { type StatusName, statusGlyph } from '@netherite/tokens'
import type { CSSProperties } from 'react'

export type StatusType = 'goal' | 'project' | 'task'

export interface StatusGlyphProps {
  readonly type: StatusType
  readonly status: StatusName
  readonly progress?: number
  readonly size?: number
  readonly label?: string
  readonly dimDone?: boolean
  readonly color?: string
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))

export function StatusGlyph({
  type,
  status,
  progress = 0,
  size = 12,
  label,
  dimDone,
  color: own,
}: StatusGlyphProps) {
  const color = own ?? `var(--nt-color-type-${type})`
  const ring =
    size >= statusGlyph.thickFrom ? 'var(--nt-status-ring-thick)' : 'var(--nt-status-ring-thin)'
  const percent = Math.round(clamp(progress) * 100)
  const fill = status === 'hold' ? 'var(--nt-status-hold)' : color
  const track = `color-mix(in srgb, ${color} var(--nt-status-track-share), transparent)`
  const style: CSSProperties = {
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
  return (
    <span
      className="nt-status-glyph"
      data-status={status}
      data-type={type}
      style={style}
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      {status === 'done' && (
        <svg
          width={Math.round(size * 0.72)}
          height={Math.round(size * 0.72)}
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path
            d="M2.4 6.3 5 8.9 9.7 3.4"
            fill="none"
            stroke="var(--nt-color-bg-shell)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}
