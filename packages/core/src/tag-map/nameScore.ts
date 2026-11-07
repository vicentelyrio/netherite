import type { TagField } from '../ops/operations'

export const keyOf = (t: { field: TagField; name: string }) => `${t.field}:${t.name}`

const editDistance = (a: string, b: string) => {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0] as number
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = row[j] as number
      row[j] = Math.min(
        above + 1,
        (row[j - 1] as number) + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      diagonal = above
    }
  }
  return row[b.length] as number
}

const squash = (name: string) =>
  name
    .toLowerCase()
    .replace(/[-_.\s]/g, '')
    .replace(/s$/, '')

export const nameScore = (a: string, b: string): number => {
  const x = squash(a)
  const y = squash(b)
  if (x === y) return 1
  if (Math.min(x.length, y.length) < 4) return 0
  const d = editDistance(x, y)
  return d <= 1 ? 0.85 : d <= 2 && Math.min(x.length, y.length) >= 6 ? 0.6 : 0
}

export const overlap = (a: ReadonlySet<string>, b: ReadonlySet<string>) => {
  let both = 0
  for (const id of a) if (b.has(id)) both++
  const union = a.size + b.size - both
  return union === 0 ? 0 : both / union
}
