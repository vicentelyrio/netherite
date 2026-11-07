import { createProcessor, type WikiLink } from '@netherite/markdown'
import type { Element, Nodes, Root } from 'hast'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import type { ReactElement } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import remarkRehype from 'remark-rehype'
import { MarkdownAnchor } from './MarkdownAnchor'
import { MarkdownImage } from './MarkdownImage'
import { wikiHref } from './wikiHref'

const processor = createProcessor().use(remarkRehype, {
  handlers: {
    yaml: () => undefined,
    wikiLink: (_state, node: WikiLink): Element => {
      const { target, heading, label } = node.data
      return {
        type: 'element',
        tagName: 'a',
        properties: {
          href: wikiHref(target) + (heading ? `#${encodeURIComponent(heading)}` : ''),
          'data-wikilink': target,
        },
        children: [{ type: 'text', value: label ?? (heading ? `${target} › ${heading}` : target) }],
      }
    },
  },
})

const components = { a: MarkdownAnchor, img: MarkdownImage }

export const renderMarkdown = (source: string): ReactElement => {
  const tree = processor.runSync(processor.parse(source), source) as Nodes as Root
  return toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components: components as never,
  }) as ReactElement
}
