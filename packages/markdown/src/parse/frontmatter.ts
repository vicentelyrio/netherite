import type { Root } from 'mdast'
import { isMap, isScalar, LineCounter, parseDocument } from 'yaml'
import type { Frontmatter } from './parse.types'

export const readFrontmatter = (tree: Root): Frontmatter | undefined => {
  const node = tree.children[0]
  if (node?.type !== 'yaml' || !node.position) return undefined
  const start = node.position.start.offset ?? 0
  const end = node.position.end.offset ?? start
  const raw = node.value
  const lineCounter = new LineCounter()
  const doc = parseDocument(raw, { lineCounter })
  const firstLine = node.position.start.line + 1
  const errors = doc.errors.map((error) => ({
    message: error.message.split('\n')[0] ?? error.message,
    line: (error.linePos?.[0].line ?? 1) + firstLine - 1,
    column: error.linePos?.[0].col ?? 1,
  }))
  const fields: Record<string, { line: number; column: number }> = {}
  if (isMap(doc.contents)) {
    for (const pair of doc.contents.items) {
      if (!isScalar(pair.key) || !pair.key.range) continue
      const { line, col } = lineCounter.linePos(pair.key.range[0])
      fields[String(pair.key.value)] = { line: line + firstLine - 1, column: col }
    }
  }
  return { raw, data: errors.length === 0 ? doc.toJS() : undefined, errors, fields, start, end }
}
