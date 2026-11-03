import type { TagMap } from '@netherite/api'

export type TagNode = (typeof TagMap.Type)['tags'][number]
export type TagPair = (typeof TagMap.Type)['duplicates'][number]
export type TagRef = Pick<TagNode, 'field' | 'name'>

export type FieldFilter = 'all' | 'tags' | 'labels'

export const keyOf = (t: TagRef) => `${t.field}:${t.name}`

/** What the page shows: the field tabs and the text filter apply together; the order is the server's. */
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

/** What a new name does to a tag: nothing, an error, or a merge into one that exists. */
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

/** The search that finds the same files by hand: every file whose frontmatter lists the tag. */
export const grepFor = (tag: TagRef) =>
  `grep -rnE '^${tag.field}:.*[[ ,]${tag.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[], ]' netherite`

/** The newest items first: IDs only ever count up. */
export const recentIds = (ids: ReadonlyArray<string>, count = 5) =>
  [...ids].sort((a, b) => b.localeCompare(a)).slice(0, count)

/** The pair as one key, so dismissing it survives a reload of the same list. */
export const pairKey = (pair: Pick<TagPair, 'a' | 'b'>) =>
  [keyOf(pair.a), keyOf(pair.b)].sort().join('|')

/** Usage as a share of the most used tag, for the bar in the list. */
export const shareOf = (total: number, max: number) => (max <= 0 ? 0 : total / max)

/** How a tag's usage splits across the four groups the screen names. */
export const groupsOf = (byType: Readonly<Record<string, number>>) => ({
  goals: byType.goal ?? 0,
  projects: byType.project ?? 0,
  tasks: byType.task ?? 0,
  docs: (byType.doc ?? 0) + (byType.runbook ?? 0) + (byType.context ?? 0) + (byType.adr ?? 0),
})
