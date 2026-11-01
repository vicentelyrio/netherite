import { type ItemType, parseId } from '@netherite/schema'

/** The folder each type lives in, under the content root (ADR-00002). */
export const typeFolders = {
  goal: 'goals',
  project: 'projects',
  task: 'tasks',
  adr: 'adr',
  doc: 'docs',
  context: 'context',
  runbook: 'runbooks',
} as const satisfies Record<ItemType, string>

const maxSlugLength = 60

/**
 * A file-name slug: lower case, accents removed, anything that is not a letter or digit becomes
 * a hyphen. Letters of any script are kept. Long titles are cut at a word boundary.
 */
export const fileSlug = (title: string) => {
  const words = title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0)

  let slug = ''
  for (const word of words) {
    const next = slug === '' ? word : `${slug}-${word}`
    if (next.length > maxSlugLength) {
      if (slug === '') slug = word.slice(0, maxSlugLength)
      break
    }
    slug = next
  }
  return slug === '' ? 'untitled' : slug
}

/** `ADR-00007-use-gnu-stow.md` for an ID and a title. The slug is fixed at creation. */
export const itemFileName = (id: string, title: string) => `${id}-${fileSlug(title)}.md`

/** Path of a new item relative to the content root, such as `adr/ADR-00007-use-gnu-stow.md`. */
export const itemRelativePath = (id: string, title: string) => {
  const type = parseId(id)?.type
  if (type === undefined) throw new Error(`Not an item ID: ${id}`)
  return `${typeFolders[type]}/${itemFileName(id, title)}`
}
