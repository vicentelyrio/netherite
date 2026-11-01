import { describe, expect, test } from 'vitest'
import { checkItem, defaultConfig, itemSchemas, knownFields, makeItemSchemas } from '../src/index'

const task = {
  id: 'TASK-00001',
  aliases: ['TASK-00001'],
  type: 'task',
  title: 'T',
  project: 'PRJ-00001',
  state: 'backlog',
}

describe('checkItem', () => {
  const check = checkItem(itemSchemas)

  test('returns nothing for a valid item', () => {
    expect(check(task)).toEqual([])
  })

  test('returns every field problem', () => {
    const issues = check({ ...task, title: '', state: 'nope' })
    expect(issues.map((i) => i.path[0]).sort()).toEqual(['state', 'title'])
  })

  test('follows the configured states', () => {
    const custom = checkItem(makeItemSchemas({ states: [{ name: 'open', category: 'todo' }] }))
    expect(custom(task)).toHaveLength(1)
    expect(custom({ ...task, state: 'open' })).toEqual([])
  })

  test('input that is not an object has a type problem', () => {
    expect(check('x')[0]?.path).toEqual(['type'])
  })
})

describe('knownFields', () => {
  const fields = knownFields(makeItemSchemas(defaultConfig))

  test('lists the fields of each type, common ones included', () => {
    expect(fields.task).toEqual(
      expect.arrayContaining(['id', 'aliases', 'type', 'title', 'project', 'state', 'depends_on']),
    )
    expect(fields.adr).toEqual(
      expect.arrayContaining(['status', 'date', 'supersedes', 'superseded_by']),
    )
    expect(fields.context).toEqual(
      expect.arrayContaining(['include_in_context', 'targets', 'priority']),
    )
  })

  test('does not list fields of other types', () => {
    expect(fields.doc).not.toContain('state')
    expect(fields.goal).not.toContain('project')
  })

  test('covers every type', () => {
    expect(Object.keys(fields).sort()).toEqual(
      ['adr', 'context', 'doc', 'goal', 'project', 'runbook', 'task'].sort(),
    )
  })
})
