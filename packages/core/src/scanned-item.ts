import { type Outline, outlineMarkdown } from '@netherite/markdown'

/** A Markdown file under the content root, parsed, with the identity fields read from its frontmatter. */
export interface ScannedItem {
  /** Path relative to the workspace root, with `/` separators. */
  readonly path: string
  /** File name without `.md`. */
  readonly fileName: string
  readonly parsed: Outline
  /** From the frontmatter. Missing or mistyped fields are `undefined` or empty here; lint reports them. */
  readonly id: string | undefined
  readonly aliases: ReadonlyArray<string>
  readonly title: string | undefined
  readonly type: string | undefined
}

const asString = (value: unknown) => (typeof value === 'string' ? value : undefined)

/** Builds a scanned item from a path and an already-parsed outline. */
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

/** Parses a file's text into a scanned item. */
export const toScannedItem = (path: string, source: string): ScannedItem =>
  scannedItemFrom(path, outlineMarkdown(source))
