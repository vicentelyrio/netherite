import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { id, relationKinds, write } from '../shared'
import type { ToolScope } from '../tools.types'

export const linkDefinition = ({ hash }: ToolScope): Tool => ({
  name: 'link',
  description:
    'Add a typed relationship from one item to another by ID. `supersedes` updates both ADRs.',
  inputSchema: {
    type: 'object',
    required: ['from', 'to', 'kind'],
    additionalProperties: false,
    properties: {
      from: id('The item that holds the relationship.'),
      to: id('The item it points at.'),
      kind: { enum: relationKinds },
      base_hash: hash,
    },
  },
  annotations: { title: 'Link items', ...write, idempotentHint: true },
})
