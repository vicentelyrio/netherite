import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { remarkGfmLite } from '../gfm-lite'
import { remarkWikiLinks } from '../wikilink'

export const createProcessor = ({ autolinks = true }: { autolinks?: boolean } = {}) =>
  unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(autolinks ? remarkGfm : remarkGfmLite)
    .use(remarkWikiLinks)

export const processor = createProcessor({ autolinks: false })
