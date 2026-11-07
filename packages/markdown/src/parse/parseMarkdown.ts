import type { Heading, ListItem, Root, RootContent } from 'mdast'
import type { Position } from 'unist'
import { uniqueSlugs } from '../slug'
import type { WikiLink } from '../wikilink'
import { readFrontmatter } from './frontmatter'
import type { ChecklistItem, HeadingInfo, LinkInfo, ParsedMarkdown } from './parse.types'
import { processor } from './processor'
import { inlineText, plainText } from './text'

const markerPattern = /^[ \t]*(?:[-*+]|\d+[.)])[ \t]+\[( |x|X)\]/

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
