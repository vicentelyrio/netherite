import type { Outline } from './parse.types'
import { parseMarkdown } from './parseMarkdown'

export const outlineMarkdown = (source: string): Outline => {
  const { tree: _tree, ...outline } = parseMarkdown(source)
  return outline
}
