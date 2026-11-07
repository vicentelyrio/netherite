export const wedge = (x: number, y: number, r: number, share: number) => {
  if (share >= 1) return `M${x - r},${y} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 ${-2 * r},0`
  const angle = share * Math.PI * 2
  const ex = x + r * Math.sin(angle)
  const ey = y - r * Math.cos(angle)
  return `M${x},${y} L${x},${y - r} A${r},${r} 0 ${share > 0.5 ? 1 : 0} 1 ${ex},${ey} Z`
}
