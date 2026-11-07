import { outlineMarkdown } from '@netherite/markdown'
import { ItemType } from '@netherite/schema'
import type { ImportType } from './import.types'
import { isObject } from './parseEntry'

export const withoutManagedBlocks = (text: string): string =>
  text.replace(
    /<!-- netherite:[a-z-]+:start -->[\s\S]*?<!-- netherite:[a-z-]+:end -->[ \t]*\r?\n?/gu,
    '',
  )

export const splitSource = (text: string): { readonly title?: string; readonly body: string } => {
  const end = text.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/)?.[0].length ?? 0
  const rest = text.slice(end)
  const heading = rest.match(/^\s*# (.+?)[ \t]*(?:\r?\n|$)/)
  if (heading === null) return { body: rest.trim() }
  return { title: heading[1] as string, body: rest.slice(heading[0].length).trim() }
}

export const withoutNumber = (title: string) => {
  const rest = title.replace(/^(?:adr[-_ ]*)?\d+\s*[.:—–)-]\s*/iu, '').trim()
  return rest === '' ? title : rest
}

export const titleFromFile = (path: string, type: ImportType) => {
  const base = (path.split('/').pop() ?? path).replace(/\.[^.]*$/u, '').replace(/^\./u, '')
  const name = type === ItemType.Adr ? base.replace(/^(?:adr[-_ ]*)?\d+[-_ ]+/iu, '') : base
  const words = name.replace(/[-_]+/gu, ' ').trim()
  return words === '' ? path : words.charAt(0).toUpperCase() + words.slice(1)
}

export const frontmatterOf = (text: string): Record<string, unknown> => {
  const data = outlineMarkdown(text).frontmatter?.data
  return isObject(data) ? data : {}
}
