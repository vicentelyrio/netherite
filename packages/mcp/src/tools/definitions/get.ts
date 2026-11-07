import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { id, readOnly } from '../shared'
import type { ToolScope } from '../tools.types'

export const getDefinition = (_scope: ToolScope): Tool => ({
  name: 'get',
  description:
    'One item in full: its fields, text, links in both directions, progress, freshness and content hash.',
  inputSchema: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: id('Item ID, such as TASK-00042.'),
      as_of: {
        type: 'string',
        description:
          'A date (2026-03-01): show the state as it stood then, rebuilt from git history. Needs git.',
      },
    },
  },
  annotations: { title: 'Get an item', ...readOnly },
})
