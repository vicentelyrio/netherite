import { pairText } from './block'
import type { Json } from './frontmatter.types'

export const renderFrontmatter = (fields: ReadonlyArray<readonly [string, Json]>, eol = '\n') => {
  const lines = fields.map(([key, value]) => pairText(key, value, 'flow', eol))
  return `---${eol}${lines.map((line) => `${line}${eol}`).join('')}---${eol}`
}
