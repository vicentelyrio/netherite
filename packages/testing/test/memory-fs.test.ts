import { Effect, FileSystem } from 'effect'
import { describe, expect, test } from 'vitest'
import { memoryFileSystem } from '../src/index'

const use = <A>(
  fs: ReturnType<typeof memoryFileSystem>,
  f: (fs: FileSystem.FileSystem) => Effect.Effect<A, unknown>,
) =>
  Effect.runPromise(
    Effect.gen(function* () {
      return yield* f(yield* FileSystem.FileSystem)
    }).pipe(Effect.provide(fs.layer)),
  )

describe('memoryFileSystem', () => {
  test('reads files it was created with and creates parent directories', async () => {
    const fs = memoryFileSystem({ '/a/b/c.txt': 'hi' })
    expect(await use(fs, (f) => f.readFileString('/a/b/c.txt'))).toBe('hi')
    expect(await use(fs, (f) => f.exists('/a/b'))).toBe(true)
    expect(await use(fs, (f) => f.readDirectory('/a'))).toEqual(['b'])
  })

  test('a missing file fails with NotFound', async () => {
    const fs = memoryFileSystem()
    const error = await use(fs, (f) => Effect.flip(f.readFileString('/nope')))
    expect(error).toMatchObject({ reason: { _tag: 'NotFound' } })
  })

  test('writes, renames and removes', async () => {
    const fs = memoryFileSystem()
    await use(fs, (f) => f.writeFileString('/x/y.md', 'one'))
    await use(fs, (f) => f.rename('/x/y.md', '/x/z.md'))
    expect(fs.files()).toEqual(['/x/z.md'])
    expect(fs.read('/x/z.md')).toBe('one')
    await use(fs, (f) => f.remove('/x', { recursive: true }))
    expect(fs.files()).toEqual([])
  })
})
