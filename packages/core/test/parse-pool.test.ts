import { generateWorkspaceFiles } from '@netherite/testing'
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'
import { parseFiles } from '../src/index'

const files = Object.entries(generateWorkspaceFiles({ count: 600, seed: 7 })).map(
  ([path, source]) => ({ path, source }),
)

describe('parseFiles', () => {
  test('worker threads give exactly the same items as the calling thread', async () => {
    const single = await Effect.runPromise(parseFiles(files, { workers: 0 }))
    const pooled = await Effect.runPromise(parseFiles(files, { workers: 3, parallelThreshold: 1 }))
    expect(pooled).toEqual(single)
    // Starting workers takes seconds when the whole suite is running at once.
  }, 30_000)

  test('keeps the order of the input', async () => {
    const pooled = await Effect.runPromise(parseFiles(files, { workers: 3, parallelThreshold: 1 }))
    expect(pooled.map((i) => i.path)).toEqual(files.map((f) => f.path))
  }, 30_000)

  test('small sets are parsed without threads', async () => {
    const few = files.slice(0, 10)
    const items = await Effect.runPromise(parseFiles(few))
    expect(items).toHaveLength(10)
  })

  test('an empty list gives an empty result', async () => {
    expect(await Effect.runPromise(parseFiles([], { parallelThreshold: 0, workers: 2 }))).toEqual(
      [],
    )
  })
})
