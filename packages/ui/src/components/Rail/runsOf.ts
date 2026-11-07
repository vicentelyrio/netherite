import type { RailItem } from './Rail.types'

export const runsOf = (items: ReadonlyArray<RailItem>) => {
  const runs: Array<{ group: string | undefined; items: RailItem[] }> = []
  for (const item of items) {
    const last = runs.at(-1)
    if (last !== undefined && item.group !== undefined && last.group === item.group)
      last.items.push(item)
    else runs.push({ group: item.group, items: [item] })
  }
  return runs
}
