import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { id, readOnly } from '../shared'
import type { ToolScope } from '../tools.types'

export const contextDefinition = (_scope: ToolScope): Tool => ({
  name: 'context',
  description:
    'The curated context for agents: context items marked for inclusion, highest priority first, within the token budget.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: { project: id('Only context for this project (and context not tied to one).') },
  },
  annotations: { title: 'Agent context', ...readOnly },
})
