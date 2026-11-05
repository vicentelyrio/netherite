import { posix } from 'node:path'

/**
 * Turns the relative Markdown links of an imported file into links between items. A link such as
 * `[the session](./0025-session.md)` in a file that was imported becomes `[[ADR-00025|the session]]`
 * when the file it points at was imported too, so the graph, backlinks and `lint` see it. Links to
 * anything else, to a heading in the same file, to a URL or to an image are left as they are, and
 * so is everything in a code block or a code span. A `#heading` after the path is dropped: the
 * link goes to the item.
 *
 * `ids` maps a source path, from the repository root with `/` separators, to an item ID. `from` is
 * the path of the file the text came from.
 */
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
      // Code spans are set aside, so a link inside one is not touched and a link whose label is a
      // code span (`[`file.md`](file.md)`) still is.
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
          } catch {
            // Keep the text as written.
          }
          const resolved = posix.normalize(posix.join(posix.dirname(from), decoded))
          if (resolved.startsWith('..')) return whole
          const id = ids.get(resolved)
          if (id === undefined) return whole
          count++
          const name = label.trim()
          // A `|` inside a table row would end the cell, so a table gets the bare link.
          if (name === '' || name === id || inTable || /[|\]]/u.test(name)) return `[[${id}]]`
          return `[[${id}|${name}]]`
        },
      )
      return rewritten.replace(/\uE000(\d+)\uE000/gu, (_, i: string) => spans[Number(i)] as string)
    })
  return { text: head + lines.join('\n'), count }
}
