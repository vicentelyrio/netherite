export interface DropTarget {
  readonly list: string
  readonly item?: string
  readonly edge?: 'before' | 'after'
}

export const positionAt = (ranks: ReadonlyArray<number>, index: number): number | undefined => {
  const before = ranks[index - 1]
  const after = ranks[index]
  if (before !== undefined && after !== undefined) return (before + after) / 2
  // Stays below the next whole number, so an item created later still lands at the end.
  if (before !== undefined) return (before + Math.floor(before) + 1) / 2
  return after === undefined ? undefined : after - 1
}

export const placeIn = (
  rows: ReadonlyArray<{ readonly id: string; readonly rank: number }>,
  moved: string,
  target: DropTarget,
): number | undefined => {
  if (target.item === moved) return undefined
  const others = rows.filter((r) => r.id !== moved)
  const at = others.findIndex((r) => r.id === target.item)
  const index =
    target.item === undefined || at === -1 ? others.length : at + (target.edge === 'after' ? 1 : 0)
  const from = rows.findIndex((r) => r.id === moved)
  if (from === index) return undefined
  return positionAt(
    others.map((r) => r.rank),
    index,
  )
}
