import {
  cleanWorkspaceFiles,
  fixedClock,
  type MemoryFileSystemOptions,
  memoryFileSystem,
} from '@netherite/testing'
import { Clock, Effect, Layer, Path } from 'effect'
import { openRepo, type Repo } from '../src/index'

export const cleanFiles = () => cleanWorkspaceFiles('/repo')

export interface World {
  readonly repo: Repo
  readonly files: () => Record<string, string>
  readonly read: (path: string) => string | undefined
  readonly layer: Layer.Layer<never>
  readonly write: (path: string, content: string) => void
  readonly remove: (path: string) => void
  readonly run: <A, E>(
    effect: Effect.Effect<A, E, never | import('effect').FileSystem.FileSystem | Path.Path>,
  ) => Promise<A>
  readonly fail: <A, E>(
    effect: Effect.Effect<A, E, import('effect').FileSystem.FileSystem | Path.Path>,
  ) => Promise<E>
}

export const now = '2026-03-05T10:30:00.000Z'

export const world = async (
  files: Record<string, string> = cleanFiles(),
  options: MemoryFileSystemOptions = {},
): Promise<World> => {
  const fs = memoryFileSystem(files, options)
  const layer = Layer.merge(fs.layer, Path.layer) as Layer.Layer<never>
  const provide = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    effect.pipe(
      Effect.provideService(Clock.Clock, fixedClock(now)),
      Effect.provide(layer as never),
    ) as Effect.Effect<A, E, never>
  const repo = await Effect.runPromise(provide(openRepo('/repo')))
  return {
    repo,
    files: () => Object.fromEntries(fs.files().map((f) => [f, fs.read(f) as string])),
    read: (path) => fs.read(path.startsWith('/') ? path : `/repo/${path}`),
    layer,
    write: (path, content) => fs.write(path.startsWith('/') ? path : `/repo/${path}`, content),
    remove: (path) => fs.remove(path.startsWith('/') ? path : `/repo/${path}`),
    run: (effect) => Effect.runPromise(provide(effect as never)) as never,
    fail: (effect) => Effect.runPromise(provide(Effect.flip(effect as never))) as never,
  }
}
