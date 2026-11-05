import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { itemJsonSchemas, itemTypes, type Repo } from '@netherite/core'

type Json = Record<string, unknown>

const idPattern = '^(GOAL|PRJ|TASK|ADR|DOC|CTX|RUN)-\\d+$'

const id = (description: string): Json => ({ type: 'string', pattern: idPattern, description })

const relationKinds = [
  'belongs_to',
  'implements',
  'explains',
  'supersedes',
  'depends_on',
  'related',
]

const reserved = new Set(['id', 'aliases', 'type', 'title', 'created'])

const fieldsFor = (schemas: Record<string, unknown>, type: string): Json => {
  const schema = schemas[type] as { properties?: Json; required?: string[] }
  const properties = Object.fromEntries(
    Object.entries(schema.properties ?? {}).filter(([name]) => !reserved.has(name)),
  )
  const required = (schema.required ?? []).filter((name) => !reserved.has(name))
  return {
    type: 'object',
    description: `Fields of a ${type}. The title, ID and creation date are set for you.`,
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: true,
  }
}

const conditional = (type: string, schemas: Record<string, unknown>): Json => {
  const needsFields = ((schemas[type] as { required?: string[] }).required ?? []).some(
    (n) => !reserved.has(n),
  )
  return Object.fromEntries([
    ['if', { properties: { type: { const: type } }, required: ['type'] }],
    [
      'then',
      {
        properties: { fields: fieldsFor(schemas, type) },
        ...(needsFields ? { required: ['fields'] } : {}),
      },
    ],
  ])
}

const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
}
const write = { readOnlyHint: false, destructiveHint: false, openWorldHint: false }

export const toolDefinitions = (repo: Repo): ReadonlyArray<Tool> => {
  const schemas = itemJsonSchemas(repo.schemas) as unknown as Record<string, unknown>
  const hash = {
    type: 'string',
    description: 'The `hash` from an earlier result. The write fails if the file changed since.',
  }
  const filters: Json = {
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
  }

  const tools: Tool[] = [
    {
      name: 'search',
      description:
        'Full-text search over IDs, titles, aliases, paths and text. Returns matching items, best first.',
      inputSchema: {
        type: 'object',
        required: ['query'],
        additionalProperties: false,
        properties: {
          query: { type: 'string', minLength: 1 },
          ...filters,
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
      annotations: { title: 'Search', ...readOnly },
    },
    {
      name: 'get',
      description:
        'One item in full: its fields, text, links in both directions, progress, freshness and content hash.',
      inputSchema: {
        type: 'object',
        required: ['id'],
        additionalProperties: false,
        properties: {
          id: id('Item ID, such as TASK-00042.'),
          as_of: {
            type: 'string',
            description:
              'A date (2026-03-01): show the state as it stood then, rebuilt from git history. Needs git.',
          },
        },
      },
      annotations: { title: 'Get an item', ...readOnly },
    },
    {
      name: 'list',
      description:
        'Items matching filters, in ID order. Use it to browse; use `search` to find by text.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { enum: [...itemTypes] },
          ...Object.fromEntries(Object.entries(filters).filter(([k]) => k !== 'types')),
          limit: { type: 'integer', minimum: 1, maximum: 500, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          as_of: {
            type: 'string',
            description:
              'A date (2026-03-01): show the state as it stood then, rebuilt from git history. Needs git.',
          },
        },
      },
      annotations: { title: 'List items', ...readOnly },
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
      name: 'delete',
      description: 'Delete an item. Refused while other items link to it, unless `force` is true.',
      inputSchema: {
        type: 'object',
        required: ['id'],
        additionalProperties: false,
        properties: {
          id: id('Item ID.'),
          force: { type: 'boolean', default: false },
          base_hash: hash,
        },
      },
      annotations: {
        title: 'Delete an item',
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    {
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
    },
    {
      name: 'lint',
      description:
        'Check one item, or the whole workspace, for schema errors, broken links, duplicate IDs, stale docs and more. Each problem has a position, rule and severity.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: { id: id('Only report on this item. Omit for the whole workspace.') },
      },
      annotations: { title: 'Lint', ...readOnly },
    },
    {
      name: 'context',
      description:
        'The curated context for agents: context items marked for inclusion, highest priority first, within the token budget.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: { project: id('Only context for this project (and context not tied to one).') },
      },
      annotations: { title: 'Agent context', ...readOnly },
    },
  ]
  return tools
}
