import { itemTypes } from '@netherite/core'

export const MimeType = { Markdown: 'text/markdown', Json: 'application/json' } as const

export const resourceList = [
  {
    uri: 'netherite://context',
    name: 'Agent context',
    description: 'Curated context for agents, within the token budget.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'netherite://timeline',
    name: 'Timeline',
    description:
      'Goals, projects, tasks and decisions on one time axis, with holds, due dates and overdue flags. Needs git.',
    mimeType: 'application/json',
  },
  {
    uri: 'netherite://stats',
    name: 'Stats (30 days)',
    description:
      'Tasks created and done, cycle time, goal areas and knowledge health over 30 days, against the 30 before. Needs git.',
    mimeType: 'application/json',
  },
  ...itemTypes.map((type) => ({
    uri: `netherite://schema/${type}`,
    name: `Schema: ${type}`,
    description: `JSON Schema for the fields of a ${type}.`,
    mimeType: 'application/json',
  })),
]
