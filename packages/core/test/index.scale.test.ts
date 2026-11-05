import { defaultConfig } from '@netherite/schema'
import { generateWorkspaceFiles } from '@netherite/testing'
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'
import { createIndex, parseFiles } from '../src/index'

const slack = process.env.CI === undefined ? 1 : 4

describe('scale', () => {
  test('5,000 generated files are parsed and indexed in under 2 seconds', async () => {
    const files = Object.entries(generateWorkspaceFiles({ count: 5000 })).map(([path, source]) => ({
      path,
      source,
    }))
    expect(files).toHaveLength(5000)

    const start = performance.now()
    const items = await Effect.runPromise(parseFiles(files))
    const index = createIndex({ config: defaultConfig })
    index.build(items)
    const elapsed = performance.now() - start

    expect(index.size()).toBe(5000)
    expect(index.graph.size).toBeGreaterThan(20000)
    expect(index.unresolved()).toEqual([])
    expect(elapsed).toBeLessThan(2000 * slack)
  }, 20000)

  test('one update in a 5,000-file index takes a few milliseconds', async () => {
    const files = Object.entries(generateWorkspaceFiles({ count: 5000, seed: 3 })).map(
      ([path, source]) => ({ path, source }),
    )
    const items = await Effect.runPromise(parseFiles(files))
    const index = createIndex({ config: defaultConfig })
    index.build(items)

    const target = items.find((i) => i.type === 'task')
    if (target === undefined) throw new Error('no task generated')
    const start = performance.now()
    index.upsert({ ...target, title: 'A new title' })
    expect(performance.now() - start).toBeLessThan(50 * slack)
  }, 20000)
})
