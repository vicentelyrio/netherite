import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { itemTypes } from '@netherite/core'
import { readOnly } from '../shared'
import type { ToolScope } from '../tools.types'

export const listDefinition = ({ filters }: ToolScope): Tool => ({
  name: 'list',
  description:
    'Items matching filters, in ID order. Use it to browse; use `search` to find by text.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { enum: [...itemTypes] },
      ...Object.fromEntries(Object.entries(filters).filter(([k]) => k !== 'types')),
      limit: { type: 'integer', minimum: 1, maximum: 500, default: 50 },
      offset: { type: 'integer', minimum: 0, default: 0 },
      as_of: {
        type: 'string',
        description:
          'A date (2026-03-01): show the state as it stood then, rebuilt from git history. Needs git.',
      },
    },
  },
  annotations: { title: 'List items', ...readOnly },
})
