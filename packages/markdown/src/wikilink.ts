import type { Literal, Root, Text } from 'mdast'
import type { Plugin } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

/**
 * A `[[target]]`, `[[target|label]]` or `[[target#heading]]` link (ADR-00004).
 * Links inside code spans and code blocks are not links, and neither are escaped ones (`\[[x]]`).
 */
export interface WikiLink extends Literal {
  type: 'wikiLink'
  /** Raw text of the link, such as `[[ADR-00007|the git ADR]]`. */
  value: string
  data: {
    /** The part before any `#` or `|`, trimmed: an id, alias, file name or title. */
    target: string
    /** The part after `#`, if any. */
    heading?: string
    /** The part after `|`, if any. */
    label?: string
  }
}

declare module 'mdast' {
  interface PhrasingContentMap {
    wikiLink: WikiLink
  }
  interface RootContentMap {
    wikiLink: WikiLink
  }
}

// `[[` not preceded by a backslash; the body has no `[`, `]`, `|` or `#` except as separators.
const pattern = /(?<!\\)\[\[([^[\]|#\n]+?)(?:#([^[\]|\n]+?))?(?:\|([^[\]\n]+?))?\]\]/g

/** Finds wikilinks in raw text. Offsets are relative to `text`. */
export const findWikiLinks = (text: string) => {
  const found: Array<{ start: number; end: number; data: WikiLink['data']; raw: string }> = []
  for (const match of text.matchAll(pattern)) {
    const target = match[1]?.trim()
    if (!target) continue
    const data: WikiLink['data'] = { target }
    const heading = match[2]?.trim()
    const label = match[3]?.trim()
    if (heading) data.heading = heading
    if (label) data.label = label
    found.push({
      start: match.index,
      end: match.index + match[0].length,
      data,
      raw: match[0],
    })
  }
  return found
}

/**
 * remark plugin that turns wikilinks in text into `wikiLink` nodes. It reads the raw source of
 * each text node, so positions stay exact and escaped brackets are left alone.
 */
export const remarkWikiLinks: Plugin<[], Root> = () => (tree, file) => {
  const source = String(file.value)
  visit(tree, 'text', (node: Text, index, parent) => {
    const position = node.position
    const start = position?.start.offset
    const end = position?.end.offset
    if (!position || start === undefined || end === undefined || !parent || index === undefined) {
      return
    }
    const raw = source.slice(start, end)
    const links = findWikiLinks(raw)
    if (links.length === 0) return

    const at = (offset: number) => {
      const before = raw.slice(0, offset)
      const lines = before.split('\n')
      const last = lines.at(-1) ?? ''
      return {
        line: position.start.line + lines.length - 1,
        column: lines.length === 1 ? position.start.column + last.length : last.length + 1,
        offset: start + offset,
      }
    }

    const replacement: Array<Text | WikiLink> = []
    let cursor = 0
    for (const link of links) {
      if (link.start > cursor) {
        replacement.push({
          type: 'text',
          value: raw.slice(cursor, link.start),
          position: { start: at(cursor), end: at(link.start) },
        })
      }
      replacement.push({
        type: 'wikiLink',
        value: link.raw,
        data: link.data,
        position: { start: at(link.start), end: at(link.end) },
      })
      cursor = link.end
    }
    if (cursor < raw.length) {
      replacement.push({
        type: 'text',
        value: raw.slice(cursor),
        position: { start: at(cursor), end: position.end },
      })
    }
    parent.children.splice(index, 1, ...(replacement as never[]))
    return [SKIP, index + replacement.length]
  })
}
