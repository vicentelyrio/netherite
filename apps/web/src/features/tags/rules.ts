import type { TagUse } from '@netherite/api'

export type FieldFilter = 'all' | 'tags' | 'labels'

/** What the page shows: the field tabs and the text filter apply together; the order is the server's. */
export const filterTags = (tags: ReadonlyArray<TagUse>, field: FieldFilter, q: string): TagUse[] =>
  tags.filter(
    (t) =>
      (field === 'all' || t.field === field) &&
      (q.trim() === '' || t.name.toLowerCase().includes(q.trim().toLowerCase())),
  )

/** What a new name does to a tag: nothing, an error, or a merge into one that exists. */
export const renameOutcome = (
  tags: ReadonlyArray<TagUse>,
  tag: TagUse,
  next: string,
): 'same' | 'empty' | 'spaces' | 'merge' | 'rename' => {
  const to = next.trim()
  if (to === '') return 'empty'
  if (/\s/.test(to)) return 'spaces'
  if (to === tag.name) return 'same'
  return tags.some((t) => t.field === tag.field && t.name === to) ? 'merge' : 'rename'
}
