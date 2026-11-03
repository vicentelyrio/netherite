/** A top for a chart's axis that halves evenly: 4 stays 4, 7 becomes 8, 23 becomes 24, 180 becomes 200. */
export const niceMax = (value: number) => {
  if (value <= 4) return Math.max(value, 1)
  const step = value <= 40 ? 4 : 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / step) * step
}

/** The chart's drawing area, in the units of its viewBox. */
export const W = 720
export const H = 220
export const pad = { left: 36, right: 12, top: 12, bottom: 28 }
export const innerW = W - pad.left - pad.right
export const innerH = H - pad.top - pad.bottom
