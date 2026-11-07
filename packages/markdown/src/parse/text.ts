import type { Root, RootContent } from 'mdast'

export const inlineText = (node: RootContent | Root): string => {
  if ('value' in node && node.type !== 'yaml') {
    return node.type === 'wikiLink' ? (node.data.label ?? node.data.target) : String(node.value)
  }
  if ('children' in node) return node.children.map(inlineText).join('')
  if (node.type === 'image') return node.alt ?? ''
  return ''
}

export const plainText = (tree: Root) => {
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
