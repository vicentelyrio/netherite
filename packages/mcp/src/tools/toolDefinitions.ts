import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { itemJsonSchemas, itemTypes, type Repo } from '@netherite/core'
import { contextDefinition } from './definitions/context'
import { createDefinition } from './definitions/create'
import { deleteDefinition } from './definitions/delete'
import { getDefinition } from './definitions/get'
import { linkDefinition } from './definitions/link'
import { lintDefinition } from './definitions/lint'
import { listDefinition } from './definitions/list'
import { markReviewedDefinition } from './definitions/markReviewed'
import { searchDefinition } from './definitions/search'
import { setStateDefinition } from './definitions/setState'
import { toggleCheckDefinition } from './definitions/toggleCheck'
import { unlinkDefinition } from './definitions/unlink'
import { updateDefinition } from './definitions/update'
import { id } from './shared'

export const toolDefinitions = (repo: Repo): ReadonlyArray<Tool> => {
  const scope = {
    repo,
    schemas: itemJsonSchemas(repo.schemas) as unknown as Record<string, unknown>,
    hash: {
      type: 'string',
      description: 'The `hash` from an earlier result. The write fails if the file changed since.',
    },
    filters: {
      types: {
        type: 'array',
        items: { enum: [...itemTypes] },
        description: 'Only these item types.',
      },
      status: {
        type: 'string',
        description: 'Only items with this status (goals, projects, ADRs) or state (tasks).',
      },
      project: id('Only items that belong to this project.'),
      tag: { type: 'string', description: 'Only items with this tag or label.' },
    },
  }
  return [
    searchDefinition(scope),
    getDefinition(scope),
    listDefinition(scope),
    createDefinition(scope),
    updateDefinition(scope),
    setStateDefinition(scope),
    toggleCheckDefinition(scope),
    linkDefinition(scope),
    unlinkDefinition(scope),
    deleteDefinition(scope),
    markReviewedDefinition(scope),
    lintDefinition(scope),
    contextDefinition(scope),
  ]
}
