import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { itemTypes } from '@netherite/core'
import { conditional, id, write } from '../shared'
import type { ToolScope } from '../tools.types'

export const createDefinition = ({ schemas }: ToolScope): Tool => ({
  name: 'create',
  description:
    'Create an item with the next free ID, or with the `id` you give for an import: it must be a free ID of the type. Give its type, title and fields; the file name, dates and folder are handled for you.',
  inputSchema: {
    type: 'object',
    required: ['type', 'title'],
    additionalProperties: false,
    properties: {
      type: { enum: [...itemTypes] },
      title: { type: 'string', minLength: 1 },
      id: id('An explicit free ID of the type, for imports. Omit it for the next free ID.'),
      fields: {
        type: 'object',
        description: 'Fields for the type (see the schema resource for each type).',
        additionalProperties: true,
      },
      body: {
        type: 'string',
        description: 'Text after the title heading, as Markdown. [[ID]] links to other items.',
      },
      created_by: {
        type: 'string',
        description: 'A @handle. Defaults to the person running the server.',
      },
    },
    allOf: itemTypes.map((type) => conditional(type, schemas)),
  },
  annotations: { title: 'Create an item', ...write },
})
