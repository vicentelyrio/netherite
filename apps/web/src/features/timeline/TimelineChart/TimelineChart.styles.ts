import type { CSSProperties } from 'react'

const labelGap = 8
const laneLabelGap = 10
const rowHeight = 36
const laneHeight = 20
const laneShift = 10

export const hue = (type: string) => `var(--nt-color-type-${type})`

export const hueStyle = (type: string) => ({ '--tl-hue': hue(type) }) as CSSProperties

export const spanStyle = (span: {
  readonly left: number
  readonly width: number
}): CSSProperties => ({
  left: `${span.left}%`,
  width: `${span.width}%`,
})

export const pointStyle = (at: number): CSSProperties => ({ left: `${at}%` })

export const labelStyle = (at: number): CSSProperties => ({ left: `calc(${at}% + ${labelGap}px)` })

export const laneLabelStyle = (at: number): CSSProperties => ({
  left: `calc(${at}% + ${laneLabelGap}px)`,
})

export const laneRowStyle = (lanes: number) =>
  ({
    '--tl-row': `${rowHeight + laneHeight * lanes}px`,
    '--tl-shift': `${laneShift * lanes}px`,
  }) as CSSProperties

export const laneStyle = (lane: number) => ({ '--lane': lane }) as CSSProperties
