import { Effect, type FileSystem } from 'effect'

export interface Overlay {
  readonly fs: FileSystem.FileSystem
  readonly changes: () => Effect.Effect<
    ReadonlyArray<{ path: string; before: string | null; after: string | null }>
  >
}

export const overlayFileSystem = (base: FileSystem.FileSystem): Overlay => {
  const written = new Map<string, string | null>()

  const readBase = (path: string) =>
    base.readFileString(path).pipe(
      Effect.map((text): string | null => text),
      Effect.orElseSucceed((): string | null => null),
    )

  const read = (path: string): Effect.Effect<string | null> =>
    written.has(path) ? Effect.succeed(written.get(path) ?? null) : readBase(path)

  const fs: FileSystem.FileSystem = {
    ...base,
    exists: (path) =>
      written.has(path) ? Effect.succeed(written.get(path) !== null) : base.exists(path),
    readFileString: (path, encoding) =>
      written.has(path)
        ? written.get(path) === null
          ? base.readFileString(path, encoding)
          : Effect.succeed(written.get(path) as string)
        : base.readFileString(path, encoding),
    writeFileString: (path, data) => Effect.sync(() => void written.set(path, data)),
    makeDirectory: () => Effect.void,
    rename: (from, to) =>
      Effect.flatMap(read(from), (text) =>
        Effect.sync(() => {
          written.set(to, text)
          written.set(from, null)
        }),
      ),
    remove: (path) => Effect.sync(() => void written.set(path, null)),
  }

  return {
    fs,
    changes: () =>
      Effect.gen(function* () {
        const result: Array<{ path: string; before: string | null; after: string | null }> = []
        for (const [path, after] of written) {
          const before = yield* readBase(path)
          if (before !== after) result.push({ path, before, after })
        }
        return result.sort((a, b) => a.path.localeCompare(b.path))
      }),
  }
}
