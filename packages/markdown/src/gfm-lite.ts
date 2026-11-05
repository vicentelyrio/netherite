import type { Root } from 'mdast'
import { gfmFootnoteFromMarkdown } from 'mdast-util-gfm-footnote'
import { gfmStrikethroughFromMarkdown } from 'mdast-util-gfm-strikethrough'
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table'
import { gfmTaskListItemFromMarkdown } from 'mdast-util-gfm-task-list-item'
import { gfmFootnote } from 'micromark-extension-gfm-footnote'
import { gfmStrikethrough } from 'micromark-extension-gfm-strikethrough'
import { gfmTable } from 'micromark-extension-gfm-table'
import { gfmTaskListItem } from 'micromark-extension-gfm-task-list-item'
import type {} from 'remark-parse'
import type { Plugin } from 'unified'

/**
 * GitHub Flavored Markdown without autolink literals: tables, task lists, strikethrough and
 * footnotes. Finding bare URLs and e-mail addresses in text is the slowest part of GFM and
 * the index does not use it, so parsing files for the index is about a third faster. Rendering
 * uses the full `remark-gfm`.
 */
export const remarkGfmLite: Plugin<[], Root> = function () {
  const data = this.data()
  data.micromarkExtensions ??= []
  data.fromMarkdownExtensions ??= []
  const micromark = data.micromarkExtensions
  const fromMarkdown = data.fromMarkdownExtensions
  micromark.push(gfmTaskListItem(), gfmTable(), gfmStrikethrough(), gfmFootnote())
  fromMarkdown.push(
    gfmTaskListItemFromMarkdown(),
    gfmTableFromMarkdown(),
    gfmStrikethroughFromMarkdown(),
    gfmFootnoteFromMarkdown(),
  )
}
