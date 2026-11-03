/** A goal's horizon: how far ahead it looks. `forever` has no end. */
export type Horizon =
  | { readonly forever: true }
  | { readonly forever: false; readonly days: number }

const units: Record<string, number> = { d: 1, w: 7, m: 30, y: 365 }

/**
 * Reads `forever`, `10 years`, `6 months`, `2 weeks`, `90 days` or the short forms `10y`, `6m`,
 * `2w`, `90d`. Anything else is `undefined`.
 */
export const parseHorizon = (text: string): Horizon | undefined => {
  const value = text.trim().toLowerCase()
  if (value === 'forever') return { forever: true }
  const match = /^(\d+)\s*(d|w|m|y|days?|weeks?|months?|years?)$/u.exec(value)
  if (match === null) return undefined
  const count = Number(match[1])
  const unit = units[(match[2] as string).charAt(0)]
  if (unit === undefined || count === 0) return undefined
  return { forever: false, days: count * unit }
}
