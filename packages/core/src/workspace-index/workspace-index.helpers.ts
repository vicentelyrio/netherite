export const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

export const stringOf = (value: unknown): string[] => (typeof value === 'string' ? [value] : [])
