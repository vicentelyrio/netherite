import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { readOnly } from '../shared'
import type { ToolScope } from '../tools.types'

export const searchDefinition = ({ filters }: ToolScope): Tool => ({
  name: 'search',
  description:
    'Full-text search over IDs, titles, aliases, paths and text. Returns matching items, best first.',
  inputSchema: {
    type: 'object',
    required: ['query'],
    additionalProperties: false,
    properties: {
      query: { type: 'string', minLength: 1 },
      ...filters,
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
  },
  annotations: { title: 'Search', ...readOnly },
})
