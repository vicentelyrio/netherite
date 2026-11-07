import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { id, readOnly } from '../shared'
import type { ToolScope } from '../tools.types'

export const lintDefinition = (_scope: ToolScope): Tool => ({
  name: 'lint',
  description:
    'Check one item, or the whole workspace, for schema errors, broken links, duplicate IDs, stale docs and more. Each problem has a position, rule and severity.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: { id: id('Only report on this item. Omit for the whole workspace.') },
  },
  annotations: { title: 'Lint', ...readOnly },
})
