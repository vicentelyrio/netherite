import { Effect, FileSystem, Path } from 'effect'
import { ItemReadError } from '../errors'
import { type ParseOptions, parseFiles } from '../parse-pool'
import { inReservedFolder } from '../reserved'
import type { ScannedItem } from '../scanned-item'
import type { Workspace } from '../workspace'

const skipped = (relative: string) =>
  relative.split('/').some((part) => part.startsWith('.')) || inReservedFolder(relative)

export const scanItems = (
  workspace: Pick<Workspace, 'root' | 'contentRoot'>,
  options?: ParseOptions,
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    const exists = yield* fs.exists(workspace.contentRoot).pipe(Effect.orElseSucceed(() => false))
    if (!exists) return [] as ScannedItem[]

    const entries = yield* fs
      .readDirectory(workspace.contentRoot, { recursive: true })
      .pipe(Effect.mapError((cause) => new ItemReadError({ path: workspace.contentRoot, cause })))

    const files = entries
      .map((entry) => entry.split(path.sep).join('/'))
      .filter((entry) => entry.toLowerCase().endsWith('.md') && !skipped(entry))
      .sort()

    const sources = yield* Effect.forEach(
      files,
      (entry) => {
        const absolute = path.join(workspace.contentRoot, entry)
        const relative = path.relative(workspace.root, absolute).split(path.sep).join('/')
        return fs.readFileString(absolute).pipe(
          Effect.mapError((cause) => new ItemReadError({ path: absolute, cause })),
          Effect.map((source) => ({ path: relative, source })),
        )
      },
      { concurrency: 32 },
    )
    return yield* parseFiles(sources, options)
  })
