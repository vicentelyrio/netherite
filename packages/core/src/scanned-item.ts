import { type Outline, outlineMarkdown } from '@netherite/markdown'

export interface ScannedItem {
  readonly path: string
  readonly fileName: string
  readonly parsed: Outline
  readonly id: string | undefined
  readonly aliases: ReadonlyArray<string>
  readonly title: string | undefined
  readonly type: string | undefined
}

const asString = (value: unknown) => (typeof value === 'string' ? value : undefined)

export const scannedItemFrom = (path: string, parsed: Outline): ScannedItem => {
  const data = parsed.frontmatter?.data
  const fields = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  const name = path.slice(path.lastIndexOf('/') + 1)
  return {
    path,
    fileName: name.replace(/\.md$/i, ''),
    parsed,
    id: asString(fields.id),
    aliases: Array.isArray(fields.aliases)
      ? fields.aliases.filter((a) => typeof a === 'string')
      : [],
    title: asString(fields.title),
    type: asString(fields.type),
  }
}

export const toScannedItem = (path: string, source: string): ScannedItem =>
  scannedItemFrom(path, outlineMarkdown(source))
