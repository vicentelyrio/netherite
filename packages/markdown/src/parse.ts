import type { Heading, ListItem, Root, RootContent } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { Position } from 'unist'
import { isMap, isScalar, LineCounter, parseDocument } from 'yaml'
import { remarkGfmLite } from './gfm-lite'
import { uniqueSlugs } from './slug'
import { remarkWikiLinks, type WikiLink } from './wikilink'

/**
 * The unified processor Netherite uses. The app renders with the same plugins (ADR-00011).
 * By default it supports full GFM; `autolinks: false` leaves out bare-URL detection, which is
 * not needed to index a file and costs about a third of the parse time.
 */
export const createProcessor = ({ autolinks = true }: { autolinks?: boolean } = {}) =>
  unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(autolinks ? remarkGfm : remarkGfmLite)
    .use(remarkWikiLinks)

export interface FrontmatterError {
  readonly message: string
  /** 1-based, in the whole file. */
  readonly line: number
  /** 1-based. */
  readonly column: number
}

export interface Frontmatter {
  /** The YAML between the `---` fences, without them. */
  readonly raw: string
  /** Parsed value. `undefined` when the YAML has errors. */
  readonly data: unknown
  readonly errors: ReadonlyArray<FrontmatterError>
  /** Where each top-level key is written, 1-based, in the whole file. */
  readonly fields: Readonly<Record<string, { readonly line: number; readonly column: number }>>
  /** Offset of the opening `---` and just past the closing one. */
  readonly start: number
  readonly end: number
}

export interface HeadingInfo {
  readonly depth: 1 | 2 | 3 | 4 | 5 | 6
  /** Plain text of the heading. */
  readonly text: string
  readonly slug: string
  readonly position: Position
  /** Offset where the section ends: the next heading of the same or higher level, or the end. */
  readonly sectionEnd: number
}

export interface LinkInfo {
  readonly target: string
  readonly heading?: string
  readonly label?: string
  readonly raw: string
  readonly position: Position
}

export interface ChecklistItem {
  readonly checked: boolean
  /** Text of the item's first line, without the marker. */
  readonly text: string
  readonly position: Position
  /** Offset of the character inside `[ ]`; replace it with ` ` or `x` to toggle the item. */
  readonly toggleOffset: number
  /** How deep the item is nested in other lists, starting at 0. */
  readonly depth: number
  /** Text of the closest heading above the item. */
  readonly section: string | undefined
}

/**
 * Everything extracted from a file, without the syntax tree. Small and plain data, so it can be
 * kept for thousands of files and passed between threads.
 */
export interface Outline {
  readonly source: string
  readonly frontmatter: Frontmatter | undefined
  /** Offset where the content after the frontmatter begins. */
  readonly bodyStart: number
  readonly headings: ReadonlyArray<HeadingInfo>
  readonly links: ReadonlyArray<LinkInfo>
  readonly checklist: ReadonlyArray<ChecklistItem>
  /** Readable text for search and previews. Excludes the frontmatter. */
  readonly text: string
}

export interface ParsedMarkdown extends Outline {
  /** The mdast tree, including the frontmatter node and `wikiLink` nodes. Positions are absolute. */
  readonly tree: Root
}

const processor = createProcessor({ autolinks: false })

const inlineText = (node: RootContent | Root): string => {
  if ('value' in node && node.type !== 'yaml') {
    return node.type === 'wikiLink' ? (node.data.label ?? node.data.target) : String(node.value)
  }
  if ('children' in node) return node.children.map(inlineText).join('')
  if (node.type === 'image') return node.alt ?? ''
  return ''
}

const plainText = (tree: Root) => {
  const lines: string[] = []
  const walk = (node: RootContent | Root) => {
    if (node.type === 'yaml') return
    if (node.type === 'code') {
      lines.push(node.value)
      return
    }
    if (
      (node.type === 'paragraph' || node.type === 'heading' || node.type === 'tableRow') &&
      'children' in node
    ) {
      lines.push(
        node.type === 'tableRow'
          ? node.children.map(inlineText).join(' ')
          : node.children.map(inlineText).join(''),
      )
      return
    }
    if ('children' in node) for (const child of node.children) walk(child as RootContent)
  }
  walk(tree)
  return lines.filter((line) => line.length > 0).join('\n')
}

const readFrontmatter = (tree: Root): Frontmatter | undefined => {
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

const markerPattern = /^[ \t]*(?:[-*+]|\d+[.)])[ \t]+\[( |x|X)\]/

/**
 * Parses a Markdown file with optional YAML frontmatter and extracts what Netherite needs:
 * links, headings, the checklist and plain text, all with source positions.
 */
export const parseMarkdown = (source: string): ParsedMarkdown => {
  const file = { value: source }
  const tree = processor.runSync(processor.parse(source), file as never) as Root

  const frontmatter = readFrontmatter(tree)

  const headingNodes: Heading[] = []
  const links: LinkInfo[] = []
  const items: Array<{ node: ListItem; depth: number }> = []

  const walk = (node: RootContent | Root, listDepth: number) => {
    if (node.type === 'heading') headingNodes.push(node)
    if (node.type === 'wikiLink' && node.position) {
      links.push({ ...(node as WikiLink).data, raw: node.value, position: node.position })
    }
    if (node.type === 'listItem') items.push({ node, depth: listDepth - 1 })
    if ('children' in node) {
      const next = node.type === 'list' ? listDepth + 1 : listDepth
      for (const child of node.children) walk(child as RootContent, next)
    }
  }
  walk(tree, 0)

  const slugs = uniqueSlugs(headingNodes.map((h) => inlineText(h)))
  const headings: HeadingInfo[] = headingNodes.map((node, i) => {
    const next = headingNodes.slice(i + 1).find((candidate) => candidate.depth <= node.depth)
    return {
      depth: node.depth,
      text: inlineText(node),
      slug: slugs[i] as string,
      position: node.position as Position,
      sectionEnd: next?.position?.start.offset ?? source.length,
    }
  })

  const headingBefore = (offset: number) =>
    headings.filter((h) => (h.position.start.offset ?? 0) < offset).at(-1)?.text

  const checklist: ChecklistItem[] = []
  for (const { node, depth } of items) {
    if (node.checked === null || node.checked === undefined || !node.position) continue
    const start = node.position.start.offset ?? 0
    const lineStart = source.lastIndexOf('\n', start - 1) + 1
    const match = markerPattern.exec(source.slice(lineStart, node.position.end.offset))
    if (!match) continue
    const first = node.children[0]
    checklist.push({
      checked: node.checked,
      text: first && first.type === 'paragraph' ? (inlineText(first).split('\n')[0] ?? '') : '',
      position: node.position,
      toggleOffset: lineStart + match[0].length - 2,
      depth,
      section: headingBefore(start),
    })
  }

  return {
    source,
    frontmatter,
    tree,
    bodyStart: frontmatter ? frontmatter.end : 0,
    headings,
    links,
    checklist,
    text: plainText(tree),
  }
}

/** Like `parseMarkdown`, but drops the tree. Use it to index many files. */
export const outlineMarkdown = (source: string): Outline => {
  const { tree: _tree, ...outline } = parseMarkdown(source)
  return outline
}
