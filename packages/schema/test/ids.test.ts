import { Schema } from 'effect'
import { describe, expect, test } from 'vitest'
import { formatId, Handle, ItemId, parseId, prefixes, TaskId } from '../src/index'

describe('ids', () => {
  test('formatId pads to five digits by default', () => {
    expect(formatId('TASK', 42)).toBe('TASK-00042')
    expect(formatId('ADR', 7, 3)).toBe('ADR-007')
    expect(formatId('GOAL', 123456)).toBe('GOAL-123456')
  })

  test('parseId splits prefix, type and number', () => {
    expect(parseId('PRJ-00012')).toEqual({ prefix: 'PRJ', type: 'project', number: 12 })
    expect(parseId('CTX-00001')?.type).toBe('context')
  })

  test('parseId rejects anything that is not an item id', () => {
    for (const bad of ['TASK-', 'TASK-1x', 'task-00001', 'EPIC-00001', 'TASK-00001 ', '']) {
      expect(parseId(bad), bad).toBeUndefined()
    }
  })

  test('every prefix has a parseable id', () => {
    for (const [type, prefix] of Object.entries(prefixes)) {
      expect(parseId(formatId(prefix, 1))?.type).toBe(type)
    }
  })

  test('TaskId accepts only TASK ids', () => {
    const decode = Schema.decodeUnknownSync(TaskId)
    expect(decode('TASK-00001')).toBe('TASK-00001')
    expect(() => decode('ADR-00001')).toThrow()
  })

  test('ItemId accepts any prefix', () => {
    const decode = Schema.decodeUnknownSync(ItemId)
    for (const prefix of Object.values(prefixes)) expect(decode(`${prefix}-00001`)).toBeDefined()
    expect(() => decode('NOTE-00001')).toThrow()
  })

  test('Handle needs a leading @', () => {
    const decode = Schema.decodeUnknownSync(Handle)
    expect(decode('@vicentelyrio')).toBe('@vicentelyrio')
    expect(decode('@a.b-c_d')).toBe('@a.b-c_d')
    for (const bad of ['ada', '@', '@ ada', '@-ada']) expect(() => decode(bad), bad).toThrow()
  })
})
