export interface BoardColumnInfo {
  readonly name: string
  readonly category: string
}

/** The strings in a frontmatter list, and nothing else. */
export const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

/** One field of an item's frontmatter, whatever the frontmatter turns out to be. */
export const field = (frontmatter: unknown, key: string): unknown =>
  typeof frontmatter === 'object' && frontmatter !== null
    ? (frontmatter as Record<string, unknown>)[key]
    : undefined
