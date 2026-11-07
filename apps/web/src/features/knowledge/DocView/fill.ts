export const fillSelection = (source: string): { anchor: number; head: number } => {
  const close = source.indexOf('\n---', 3)
  const start = close === -1 ? 0 : close + 4
  const found = /^# .*\n+((?!#).+)$/m.exec(source.slice(start))
  if (found?.[1] === undefined) return { anchor: source.length, head: source.length }
  const anchor = start + found.index + found[0].length - found[1].length
  return { anchor, head: anchor + found[1].length }
}
