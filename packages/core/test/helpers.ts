import { NodeFileSystem, NodePath } from '@effect/platform-node'
import { fixturePath, memoryFileSystem, withTempDir } from '@netherite/testing'
import { Effect, type FileSystem, Layer, Path } from 'effect'
import { type ScannedItem, scanItems, toScannedItem } from '../src/index'

const real = Layer.merge(NodeFileSystem.layer, NodePath.layer)

/** Scans a copy of `fixtures/basic` from disk. */
export const scanFixture = async (name = 'basic'): Promise<ReadonlyArray<ScannedItem>> =>
  withTempDir(name, (dir) =>
    Effect.runPromise(
      scanItems({ root: dir, contentRoot: `${dir}/netherite` }).pipe(Effect.provide(real)),
    ),
  )

/** Builds scanned items from `{ path: file text }` without touching disk. */
export const itemsFrom = (files: Record<string, string>) =>
  Object.entries(files).map(([path, text]) => toScannedItem(path, text))

/** A minimal item file with the given frontmatter fields. */
export const itemFile = (
  fields: { id?: string; aliases?: string[]; title?: string; type?: string },
  body = '',
) => {
  const lines = ['---']
  if (fields.id) lines.push(`id: ${fields.id}`)
  if (fields.aliases) lines.push(`aliases: [${fields.aliases.join(', ')}]`)
  if (fields.type) lines.push(`type: ${fields.type}`)
  if (fields.title) lines.push(`title: ${fields.title}`)
  lines.push('---', '', body, '')
  return lines.join('\n')
}

export const runWithMemory = <A, E>(
  effect: Effect.Effect<A, E, FileSystem.FileSystem | Path.Path>,
  files: Record<string, string>,
) =>
  Effect.runPromise(
    effect.pipe(Effect.provide(Layer.merge(memoryFileSystem(files).layer, Path.layer))),
  )

export { fixturePath }
