import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { id, write } from '../shared'
import type { ToolScope } from '../tools.types'

export const markReviewedDefinition = ({ hash }: ToolScope): Tool => ({
  name: 'mark_reviewed',
  description:
    'Record that a doc, runbook or context item was reviewed, by setting `reviewed_at`. Defaults to today.',
  inputSchema: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: id('Doc, runbook or context ID.'),
      date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      base_hash: hash,
    },
  },
  annotations: { title: 'Mark reviewed', ...write, idempotentHint: true },
})
