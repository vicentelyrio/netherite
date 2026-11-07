import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { id, relationKinds, write } from '../shared'
import type { ToolScope } from '../tools.types'

export const unlinkDefinition = ({ hash }: ToolScope): Tool => ({
  name: 'unlink',
  description:
    "Remove a typed relationship. Required ones, such as a task's project, cannot be removed.",
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
  annotations: { title: 'Unlink items', ...write, idempotentHint: true },
})
