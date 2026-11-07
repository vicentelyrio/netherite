import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { id } from '../shared'
import type { ToolScope } from '../tools.types'

export const deleteDefinition = ({ hash }: ToolScope): Tool => ({
  name: 'delete',
  description: 'Delete an item. Refused while other items link to it, unless `force` is true.',
  inputSchema: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: id('Item ID.'),
      force: { type: 'boolean', default: false },
      base_hash: hash,
    },
  },
  annotations: {
    title: 'Delete an item',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
})
