import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { id, write } from '../shared'
import type { ToolScope } from '../tools.types'

export const updateDefinition = ({ hash }: ToolScope): Tool => ({
  name: 'update',
  description:
    'Change fields and/or one section of an item. Only the lines you change are touched. Use `set_state` for states and `link` for relationships.',
  inputSchema: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: id('Item ID.'),
      set: {
        type: 'object',
        additionalProperties: true,
        description: 'Fields to set. `id` and `type` cannot be changed.',
      },
      unset: { type: 'array', items: { type: 'string' }, description: 'Fields to remove.' },
      section: {
        type: 'object',
        required: ['heading', 'content'],
        additionalProperties: false,
        properties: {
          heading: { type: 'string' },
          content: { type: 'string', description: 'Markdown for the section body.' },
          mode: {
            enum: ['replace', 'append', 'create'],
            default: 'replace',
            description:
              '`replace` swaps the text, `append` adds to it, `create` adds a new section at the end.',
          },
        },
      },
      base_hash: hash,
    },
  },
  annotations: { title: 'Update an item', ...write, idempotentHint: true },
})
