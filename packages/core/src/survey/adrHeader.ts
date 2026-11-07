export const pad = (n: number, width: number) => String(n).padStart(width, '0')

export const adrNumber = (name: string): number | undefined => {
  const m = name.match(/^(?:adr[-_ ]*)?(\d{1,5})(?:[-_. ]|$)/i)
  return m === null ? undefined : Number(m[1])
}

export const adrStatus = (text: string): string | undefined => {
  const line = text.match(/^\s*[-*]?\s*\**status\**:\**\s*(.+)$/im)?.[1]
  const section = text.match(/^#{1,4}\s*status\s*\r?\n+\s*([^\r\n#].*)$/im)?.[1]
  const raw = (line ?? section)
    ?.replace(/[*_`[\]]/g, '')
    .trim()
    .toLowerCase()
  if (raw === undefined || raw === '') return undefined
  if (raw.startsWith('superseded')) return 'superseded'
  if (raw.startsWith('deprecated') || raw.startsWith('retired') || raw.startsWith('rejected')) {
    return 'deprecated'
  }
  if (raw.startsWith('accepted') || raw.startsWith('approved') || raw.startsWith('adopted')) {
    return 'accepted'
  }
  if (raw.startsWith('proposed') || raw.startsWith('draft')) return 'proposed'
  return undefined
}

export const adrDate = (text: string): string | undefined =>
  text.match(/^\s*[-*]?\s*\**date\**:\**\s*(\d{4}-\d{2}-\d{2})/im)?.[1] ??
  text.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/im)?.[1]
