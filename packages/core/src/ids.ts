import { defaultIdPadding, formatId, type ItemType, parseId, prefixes } from '@netherite/schema'
import type { ScannedItem } from './scanned-item'

/** The number in a file name that starts with an ID, such as `TASK-00042-do-it`. */
const fileNameId = (fileName: string) => /^([A-Z]+-\d+)(?:-|$)/.exec(fileName)?.[1]

/**
 * The next free ID for a type: one more than the highest number in use, looking at both
 * frontmatter IDs and file names so a file without frontmatter still reserves its number.
 */
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

/** The next `count` free IDs for a type, in order. */
export const nextIds = (
  items: Iterable<Pick<ScannedItem, 'id' | 'fileName'>>,
  type: ItemType,
  count: number,
  padding: number = defaultIdPadding,
) => {
  const first = parseId(nextId(items, type, padding))?.number ?? 1
  return Array.from({ length: count }, (_, i) => formatId(prefixes[type], first + i, padding))
}
