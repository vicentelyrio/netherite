import type { ScannedItem } from '../scanned-item'
import { fieldsOf } from './fieldsOf'

export const rankOf = (item: ScannedItem) => {
  const position = fieldsOf(item).position
  if (typeof position === 'number' && Number.isFinite(position)) return position
  const number = /(\d+)$/.exec(item.id ?? '')
  return number === null ? 0 : Number(number[1])
}

export const byRank = (a: ScannedItem, b: ScannedItem) =>
  rankOf(a) - rankOf(b) || (a.id ?? '').localeCompare(b.id ?? '')
