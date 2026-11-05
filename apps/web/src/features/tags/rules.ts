import type { TagMap } from '@netherite/api'

export type TagNode = (typeof TagMap.Type)['tags'][number]
export type TagPair = (typeof TagMap.Type)['duplicates'][number]
export type TagRef = Pick<TagNode, 'field' | 'name'>

export type FieldFilter = 'all' | 'tags' | 'labels'

export const keyOf = (t: TagRef) => `${t.field}:${t.name}`

export const filterTags = <T extends TagRef>(
  tags: ReadonlyArray<T>,
  field: FieldFilter,
  q: string,
): T[] =>
  tags.filter(
    (t) =>
      (field === 'all' || t.field === field) &&
      (q.trim() === '' || t.name.toLowerCase().includes(q.trim().toLowerCase())),
  )

export const renameOutcome = (
  tags: ReadonlyArray<TagRef>,
  tag: TagRef,
  next: string,
): 'same' | 'empty' | 'spaces' | 'merge' | 'rename' => {
  const to = next.trim()
  if (to === '') return 'empty'
  if (/\s/.test(to)) return 'spaces'
  if (to === tag.name) return 'same'
  return tags.some((t) => t.field === tag.field && t.name === to) ? 'merge' : 'rename'
}

export const grepFor = (tag: TagRef) =>
  `grep -rnE '^${tag.field}:.*[[ ,]${tag.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[], ]' netherite`

export const recentIds = (ids: ReadonlyArray<string>, count = 5) =>
  [...ids].sort((a, b) => b.localeCompare(a)).slice(0, count)

export const pairKey = (pair: Pick<TagPair, 'a' | 'b'>) =>
  [keyOf(pair.a), keyOf(pair.b)].sort().join('|')

export const shareOf = (total: number, max: number) => (max <= 0 ? 0 : total / max)

export const groupsOf = (byType: Readonly<Record<string, number>>) => ({
  goals: byType.goal ?? 0,
  projects: byType.project ?? 0,
  tasks: byType.task ?? 0,
  docs: (byType.doc ?? 0) + (byType.runbook ?? 0) + (byType.context ?? 0) + (byType.adr ?? 0),
})
