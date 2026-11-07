import { posix } from 'node:path'

export const rewriteLinks = (
  text: string,
  from: string,
  ids: ReadonlyMap<string, string>,
): { readonly text: string; readonly count: number } => {
  const frontEnd = text.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/)?.[0].length ?? 0
  const head = text.slice(0, frontEnd)
  let count = 0
  let fenced = false
  const link = /(!?)\[([^\]\n]*)\]\(\s*<?([^)\s>]+)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/gu

  const lines = text
    .slice(frontEnd)
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/u.test(line)) {
        fenced = !fenced
        return line
      }
      if (fenced) return line
      const inTable = line.trimStart().startsWith('|')
      const spans: string[] = []
      const masked = line.replace(/`[^`\n]*`/gu, (span) => {
        spans.push(span)
        return `\uE000${spans.length - 1}\uE000`
      })
      const rewritten = masked.replace(
        link,
        (whole, image: string, label: string, target: string) => {
          if (image === '!') return whole
          const pathPart = target.split('#')[0] as string
          if (pathPart === '' || /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(pathPart)) return whole
          if (pathPart.startsWith('/')) return whole
          let decoded = pathPart
          try {
            decoded = decodeURI(pathPart)
          } catch {}
          const resolved = posix.normalize(posix.join(posix.dirname(from), decoded))
          if (resolved.startsWith('..')) return whole
          const id = ids.get(resolved)
          if (id === undefined) return whole
          count++
          const name = label.trim()
          if (name === '' || name === id || inTable || /[|\]]/u.test(name)) return `[[${id}]]`
          return `[[${id}|${name}]]`
        },
      )
      return rewritten.replace(/\uE000(\d+)\uE000/gu, (_, i: string) => spans[Number(i)] as string)
    })
  return { text: head + lines.join('\n'), count }
}
