export type Json = Record<string, unknown>

export const idPattern = '^(GOAL|PRJ|TASK|ADR|DOC|CTX|RUN)-\\d+$'

export const id = (description: string): Json => ({
  type: 'string',
  pattern: idPattern,
  description,
})

export const relationKinds = [
  'belongs_to',
  'implements',
  'explains',
  'supersedes',
  'depends_on',
  'related',
]

export const reserved = new Set(['id', 'aliases', 'type', 'title', 'created'])

export const fieldsFor = (schemas: Record<string, unknown>, type: string): Json => {
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

export const conditional = (type: string, schemas: Record<string, unknown>): Json => {
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

export const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
}

export const write = { readOnlyHint: false, destructiveHint: false, openWorldHint: false }
