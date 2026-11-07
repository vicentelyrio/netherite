import { type ItemType, parseId, settingDefaults } from '@netherite/schema'

export const typeFolders = {
  goal: 'goals',
  project: 'projects',
  task: 'tasks',
  adr: 'adr',
  doc: 'docs',
  context: 'context',
  runbook: 'runbooks',
} as const satisfies Record<ItemType, string>

const maxSlugLength = settingDefaults.content.slugMaxLength

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

export const itemFileName = (id: string, title: string) => `${id}-${fileSlug(title)}.md`

export const itemRelativePath = (id: string, title: string) => {
  const type = parseId(id)?.type
  if (type === undefined) throw new Error(`Not an item ID: ${id}`)
  return `${typeFolders[type]}/${itemFileName(id, title)}`
}
