import { describe, expect, test } from 'vitest'
import {
  defaultConfig,
  itemJsonSchemas,
  itemSchemas,
  itemTypes,
  makeItemSchemas,
} from '../src/index'

type Json = {
  type: string
  required: string[]
  properties: Record<string, { pattern?: string; enum?: string[]; type?: string }>
}

const schemas = itemJsonSchemas(itemSchemas) as unknown as Record<string, Json>

describe('itemJsonSchemas', () => {
  test.each(itemTypes)('%s is an object schema with the common fields required', (type) => {
    const schema = schemas[type] as Json
    expect(schema.type).toBe('object')
    expect(schema.required).toEqual(expect.arrayContaining(['id', 'aliases', 'type', 'title']))
  })

  test('id patterns carry the type prefix', () => {
    expect(schemas.task?.properties.id?.pattern).toBe('^TASK-\\d+$')
    expect(schemas.adr?.properties.id?.pattern).toBe('^ADR-\\d+$')
  })

  test('the type field is fixed per schema', () => {
    for (const type of itemTypes) {
      expect(schemas[type]?.properties.type?.enum ?? schemas[type]?.properties.type).toBeDefined()
    }
  })

  test('task states come from the configuration', () => {
    const custom = makeItemSchemas({
      states: [
        { name: 'open', category: 'todo' },
        { name: 'closed', category: 'done' },
      ],
    })
    const task = itemJsonSchemas(custom).task as unknown as Json
    expect(task.properties.state?.enum).toEqual(['open', 'closed'])
    expect((schemas.task as Json).properties.state?.enum).toEqual(
      defaultConfig.states.map((s) => s.name),
    )
  })

  test('adr status is limited to the lifecycle values', () => {
    expect(schemas.adr?.properties.status?.enum).toEqual([
      'proposed',
      'accepted',
      'deprecated',
      'superseded',
    ])
  })
})
