import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { fixturePath } from '../src/index'

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  )

const items = walk(join(fixturePath('basic'), 'netherite')).map((path) => {
  const text = readFileSync(path, 'utf8')
  const front = text.split('\n---\n')[0] ?? ''
  const field = (name: string) => new RegExp(`^${name}: (.+)$`, 'm').exec(front)?.[1]
  return { path, id: field('id'), type: field('type') }
})

describe('fixtures/basic', () => {
  test('has every item type', () => {
    const types = new Set(items.map((item) => item.type))
    expect([...types].sort()).toEqual(
      ['adr', 'context', 'doc', 'goal', 'project', 'runbook', 'task'].sort(),
    )
  })

  test('has exactly one duplicated id, as the expected lint result says', () => {
    const counts = new Map<string, number>()
    for (const { id } of items) if (id) counts.set(id, (counts.get(id) ?? 0) + 1)
    const duplicated = [...counts].filter(([, count]) => count > 1).map(([id]) => id)
    expect(duplicated).toEqual(['TASK-00001'])
  })

  test('lists only files that exist in the expected lint results', () => {
    const expected = JSON.parse(readFileSync(join(fixturePath('basic'), 'expected.json'), 'utf8'))
    for (const { path } of expected.lint) {
      expect(() => readFileSync(join(fixturePath('basic'), path))).not.toThrow()
    }
  })
})
