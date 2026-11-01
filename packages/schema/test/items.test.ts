import { describe, expect, test } from 'vitest'
import { makeItemSchemas, validateItem } from '../src/index'
import { failure, fixtureConfig, fixtureItems, success } from './helpers'

const check = validateItem(makeItemSchemas(fixtureConfig))

describe('fixtures/basic', () => {
  const invalid = new Set(['netherite/tasks/TASK-00091-bad-state.md'])

  test.each(fixtureItems.filter((i) => !invalid.has(i.path)))('$path validates', async (item) => {
    await expect(success(check(item.data))).resolves.toBeDefined()
  })

  test('an unknown task state is a field-level error', async () => {
    const item = fixtureItems.find((i) => invalid.has(i.path))
    const error = await failure(check(item?.data))

    expect(error._tag).toBe('ValidationError')
    expect(error.issues).toHaveLength(1)
    expect(error.issues[0]?.path).toEqual(['state'])
    expect(error.issues[0]?.message).toContain('"backlog"')
  })
})

describe('validation errors', () => {
  const task = {
    id: 'TASK-00001',
    aliases: ['TASK-00001'],
    type: 'task',
    title: 'Valid',
    project: 'PRJ-00001',
    state: 'backlog',
  }

  const cases: Array<[string, unknown, ReadonlyArray<string>]> = [
    ['missing title', { ...task, title: undefined }, ['title']],
    ['empty title', { ...task, title: '' }, ['title']],
    ['id with the wrong prefix', { ...task, id: 'ADR-00001' }, ['id']],
    ['project that is not a project id', { ...task, project: 'TASK-00002' }, ['project']],
    ['assignee without @', { ...task, assignees: ['ada'] }, ['assignees', '0']],
    ['depends_on pointing at a doc', { ...task, depends_on: ['DOC-00001'] }, ['depends_on', '0']],
    ['due that is not a date', { ...task, due: 'tomorrow' }, ['due']],
    ['created that is not a date-time', { ...task, created: '2026-01-01' }, ['created']],
    ['tags that is not a list', { ...task, tags: 'a' }, ['tags']],
  ]

  test.each(cases)('%s', async (_name, input, path) => {
    const error = await failure(check(input))
    expect(error.issues.map((i) => i.path.map(String))).toContainEqual([...path])
  })

  test('reports every problem at once', async () => {
    const error = await failure(check({ ...task, title: '', state: 'nope', due: 'x' }))
    expect(error.issues.map((i) => i.path[0]).sort()).toEqual(['due', 'state', 'title'])
  })

  test('an ADR needs a valid status and date', async () => {
    const error = await failure(
      check({ id: 'ADR-00001', aliases: [], type: 'adr', title: 'T', status: 'done', date: '1/1' }),
    )
    expect(error.issues.map((i) => i.path[0]).sort()).toEqual(['date', 'status'])
  })

  test('a project needs at least one goal', async () => {
    const error = await failure(
      check({
        id: 'PRJ-00001',
        aliases: [],
        type: 'project',
        title: 'T',
        status: 'active',
        goals: [],
      }),
    )
    expect(error.issues[0]?.path[0]).toBe('goals')
  })

  test('an unknown type names the allowed types', async () => {
    const error = await failure(check({ type: 'epic', id: 'EPIC-1' }))
    expect(error.issues).toEqual([
      {
        path: ['type'],
        message: 'Expected one of "goal", "project", "task", "adr", "doc", "context", "runbook"',
      },
    ])
  })

  test('a value that is not an object has a type error', async () => {
    const error = await failure(check('not an object'))
    expect(error.issues[0]?.path).toEqual(['type'])
  })

  test('the error message lists each problem on its own line', async () => {
    const error = await failure(check({ ...task, title: '', due: 'x' }))
    expect(error.message.split('\n')).toHaveLength(2)
    expect(error.message).toMatch(/^title: /m)
  })
})

describe('unknown fields', () => {
  test('are kept on every item type', async () => {
    for (const { path, data } of fixtureItems) {
      if (path.endsWith('TASK-00091-bad-state.md')) continue
      const item = await success(check({ ...(data as object), custom_field: { a: 1 } }))
      expect(item, path).toHaveProperty('custom_field', { a: 1 })
    }
  })
})
