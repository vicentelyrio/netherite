import type { Placed } from './layout'

const sideThreshold = 0.38
const sideGap = 6
const sideLift = 10
const aboveGap = 24
const belowGap = 5

export const labelPlacement = (p: Placed, r: number, parent: Placed | undefined) => {
  if (parent !== undefined && p.type === 'task') {
    const angle = Math.atan2(p.y - parent.y, p.x - parent.x)
    const ux = Math.cos(angle)
    const uy = Math.sin(angle)
    if (ux > sideThreshold)
      return { x: p.x + r + sideGap, y: p.y - sideLift, anchor: 'start' as const }
    if (ux < -sideThreshold)
      return { x: p.x - r - sideGap, y: p.y - sideLift, anchor: 'end' as const }
    if (uy < 0) return { x: p.x, y: p.y - r - aboveGap, anchor: 'middle' as const }
  }
  return { x: p.x, y: p.y + r + belowGap, anchor: 'middle' as const }
}
