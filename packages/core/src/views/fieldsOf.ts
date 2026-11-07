import type { ScannedItem } from '../scanned-item'

type Fields = Record<string, unknown>

export const fieldsOf = (item: ScannedItem): Fields => {
  const data = item.parsed.frontmatter?.data
  return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Fields) : {}
}
