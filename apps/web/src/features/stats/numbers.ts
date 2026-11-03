export interface Point {
  readonly week: string
  readonly done: number
  readonly total: number
}

/** Done over total as a percentage, or 0 for a week with no tasks yet. */
export const percent = (p: Point) => (p.total <= 0 ? 0 : Math.round((p.done / p.total) * 100))

export const adrColors = {
  proposed: '#a5a7ff',
  accepted: '#2cc27e',
  deprecated: '#f0717e',
  superseded: '#969ab8',
} as const

export const adrOrder = ['proposed', 'accepted', 'deprecated', 'superseded'] as const

export const lineColors = [
  '#8f91f2',
  '#3ba474',
  '#d9a646',
  '#d2a8f0',
  '#8fc3f2',
  '#f0b397',
  '#7ed6c8',
]
