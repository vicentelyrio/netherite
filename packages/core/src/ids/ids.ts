import { defaultIdPadding, formatId, type ItemType, parseId, prefixes } from '@netherite/schema'
import type { ScannedItem } from '../scanned-item'

const fileNameId = (fileName: string) => /^([A-Z]+-\d+)(?:-|$)/.exec(fileName)?.[1]

export const nextId = (
  items: Iterable<Pick<ScannedItem, 'id' | 'fileName'>>,
  type: ItemType,
  padding: number = defaultIdPadding,
) => {
  const prefix = prefixes[type]
  let highest = 0
  for (const item of items) {
    for (const candidate of [item.id, fileNameId(item.fileName)]) {
      const parsed = candidate === undefined ? undefined : parseId(candidate)
      if (parsed?.prefix === prefix && parsed.number > highest) highest = parsed.number
    }
  }
  return formatId(prefix, highest + 1, padding)
}

export const nextIds = (
  items: Iterable<Pick<ScannedItem, 'id' | 'fileName'>>,
  type: ItemType,
  count: number,
  padding: number = defaultIdPadding,
) => {
  const first = parseId(nextId(items, type, padding))?.number ?? 1
  return Array.from({ length: count }, (_, i) => formatId(prefixes[type], first + i, padding))
}
