import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { id, write } from '../shared'
import type { ToolScope } from '../tools.types'

export const toggleCheckDefinition = ({ hash }: ToolScope): Tool => ({
  name: 'toggle_check',
  description:
    "Tick or untick checklist items in an item's text: one `item`, a list of `items`, or `all`, in one write. The edit is all or nothing: an item that does not exist changes none. The result lists each item as it is now.",
  inputSchema: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: id('Item ID.'),
      item: {
        oneOf: [{ type: 'integer', minimum: 0 }, { type: 'string' }],
        description: 'One checklist item: its 0-based position, or its exact text.',
      },
      items: {
        type: 'array',
        minItems: 1,
        items: { oneOf: [{ type: 'integer', minimum: 0 }, { type: 'string' }] },
        description: 'Several checklist items, each a position or its exact text.',
      },
      all: {
        type: 'boolean',
        description: 'Every checklist item. Ticks them unless `checked` is false.',
      },
      checked: {
        type: 'boolean',
        description: 'Set to this state. Omit to flip each one (with `all`, omit to tick).',
      },
      base_hash: hash,
    },
  },
  annotations: { title: 'Tick a checklist item', ...write },
})
