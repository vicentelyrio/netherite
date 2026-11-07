export const detectEol = (source: string) => {
  const index = source.indexOf('\n')
  return index > 0 && source[index - 1] === '\r' ? '\r\n' : '\n'
}

export const withEol = (text: string, eol: string) => text.replace(/\r?\n/g, eol)

export const lineEndAfter = (text: string, offset: number) => {
  let p = offset
  while (p > 0 && (text[p - 1] === '\n' || text[p - 1] === '\r')) p--
  const newline = text.indexOf('\n', p)
  return newline === -1 ? text.length : newline + 1
}

export const lineStartOf = (text: string, offset: number) => text.lastIndexOf('\n', offset - 1) + 1

export interface FrontmatterSpan {
  readonly innerStart: number
  readonly innerEnd: number
}

export const findFrontmatter = (source: string): FrontmatterSpan | undefined => {
  const open = /^---[ \t]*\r?\n/.exec(source)
  if (open === null) return undefined
  const close = /^---[ \t]*(?:\r?\n|$)/gm
  close.lastIndex = open[0].length
  const match = close.exec(source)
  if (match === null) return undefined
  return { innerStart: open[0].length, innerEnd: match.index }
}
