import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { id, write } from '../shared'
import type { ToolScope } from '../tools.types'

export const setStateDefinition = ({ hash, repo }: ToolScope): Tool => ({
  name: 'set_state',
  description:
    "Set a task's state, an ADR's status, or whether a doc, runbook or context item is `active`, `deprecated` or `superseded`. Making an item `superseded` needs `superseded_by` and updates both items. A retired item is left out of freshness and of agent context.",
  inputSchema: {
    type: 'object',
    required: ['id', 'state'],
    additionalProperties: false,
    properties: {
      id: id('Task, ADR, doc, runbook or context ID.'),
      state: {
        type: 'string',
        description: `Task states: ${repo.workspace.config.states.map((s) => s.name).join(', ')}. ADR statuses: proposed, accepted, deprecated, superseded. Doc, runbook and context statuses: active, deprecated, superseded.`,
      },
      superseded_by: id(
        'The item that replaces this one, of the same kind. Required when state is superseded.',
      ),
      base_hash: hash,
    },
  },
  annotations: { title: 'Set state', ...write, idempotentHint: true },
})
