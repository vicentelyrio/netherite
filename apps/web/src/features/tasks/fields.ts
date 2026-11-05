export interface BoardColumnInfo {
  readonly name: string
  readonly category: string
}

export const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

export const field = (frontmatter: unknown, key: string): unknown =>
  typeof frontmatter === 'object' && frontmatter !== null
    ? (frontmatter as Record<string, unknown>)[key]
    : undefined
