import { type StatusName, statusGlyph } from '@netherite/tokens'
import type { CSSProperties } from 'react'

export type StatusType = 'goal' | 'project' | 'task'

export interface StatusGlyphProps {
  /** Whose colour it wears: hue is always the type. */
  readonly type: StatusType
  readonly status: StatusName
  /** How much is done, from 0 to 1: the filled part of the pie. Ignored when done. */
  readonly progress?: number
  /** The diameter in pixels, from 6 (a task in the graph) to 32 (a goal). */
  readonly size?: number
  /** Say it aloud, e.g. "In progress, 60%". Without it the glyph is decoration. */
  readonly label?: string
  /** Draw done items a little fainter, as the graph does. */
  readonly dimDone?: boolean
  /** A colour of its own, for samples in a legend; otherwise the type's. */
  readonly color?: string
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Where a goal, project or task stands (ADR-00021), by fill and never by hue: a pie filled to the
 * share done; a halo while in progress; a grey pie and a dashed ring on hold; a solid fill with a
 * check when done. Hue stays the type's.
 */
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
