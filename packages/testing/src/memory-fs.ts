import { Effect, FileSystem, type Layer, Option, PlatformError } from 'effect'

type Entry = { readonly kind: 'file'; content: Uint8Array } | { readonly kind: 'directory' }

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const normalize = (path: string) => {
  const parts: string[] = []
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return `/${parts.join('/')}`
}

const parentOf = (path: string) => normalize(`${path}/..`)

const notFound = (method: string, path: string) =>
  PlatformError.systemError({
    _tag: 'NotFound',
    module: 'FileSystem',
    method,
    pathOrDescriptor: path,
    description: 'No such file or directory',
  })

export interface MemoryFileSystem {
  readonly layer: Layer.Layer<FileSystem.FileSystem>
  /** Current content of a file, or `undefined` if it does not exist. */
  readonly read: (path: string) => string | undefined
  /** Paths of all files, sorted. */
  readonly files: () => ReadonlyArray<string>
}

/**
 * An in-memory `FileSystem` with POSIX-style absolute paths, for tests that must not touch disk.
 * Parent directories are created implicitly. Only the operations Netherite uses are implemented;
 * the rest fail with an error.
 */
export const memoryFileSystem = (
  initial: Readonly<Record<string, string>> = {},
): MemoryFileSystem => {
  const entries = new Map<string, Entry>([['/', { kind: 'directory' }]])

  const ensureParents = (path: string) => {
    for (let dir = parentOf(path); !entries.has(dir); dir = parentOf(dir)) {
      entries.set(dir, { kind: 'directory' })
    }
  }
  const setFile = (path: string, content: Uint8Array) => {
    const target = normalize(path)
    ensureParents(target)
    entries.set(target, { kind: 'file', content })
  }
  for (const [path, content] of Object.entries(initial)) setFile(path, encoder.encode(content))

  const get = (method: string, path: string) => {
    const entry = entries.get(normalize(path))
    return entry ? Effect.succeed(entry) : Effect.fail(notFound(method, path))
  }

  const impl: Partial<FileSystem.FileSystem> = {
    exists: (path) => Effect.succeed(entries.has(normalize(path))),
    readFile: (path) =>
      Effect.flatMap(get('readFile', path), (entry) =>
        entry.kind === 'file'
          ? Effect.succeed(entry.content)
          : Effect.fail(notFound('readFile', path)),
      ),
    readFileString: (path) =>
      Effect.flatMap(get('readFileString', path), (entry) =>
        entry.kind === 'file'
          ? Effect.succeed(decoder.decode(entry.content))
          : Effect.fail(notFound('readFileString', path)),
      ),
    stat: (path) =>
      Effect.map(
        get('stat', path),
        (entry) =>
          ({
            type: entry.kind === 'file' ? 'File' : 'Directory',
            mtime: Option.none(),
            atime: Option.none(),
            birthtime: Option.none(),
            mode: 0o644,
            size: entry.kind === 'file' ? entry.content.length : 0,
          }) as never,
      ),
    readDirectory: (path) =>
      Effect.flatMap(get('readDirectory', path), () => {
        const dir = normalize(path)
        const names = [...entries.keys()]
          .filter((key) => key !== dir && parentOf(key) === dir)
          .map((key) => key.slice(key === '/' ? 1 : dir.length + (dir === '/' ? 0 : 1)))
        return Effect.succeed(names.sort())
      }),
    realPath: (path) => Effect.succeed(normalize(path)),
    makeDirectory: (path) =>
      Effect.sync(() => {
        const target = normalize(path)
        ensureParents(target)
        if (!entries.has(target)) entries.set(target, { kind: 'directory' })
      }),
    writeFile: (path, data) => Effect.sync(() => setFile(path, data)),
    writeFileString: (path, data) => Effect.sync(() => setFile(path, encoder.encode(data))),
    remove: (path) =>
      Effect.sync(() => {
        const target = normalize(path)
        for (const key of [...entries.keys()]) {
          if (key === target || key.startsWith(`${target}/`)) entries.delete(key)
        }
      }),
    rename: (from, to) =>
      Effect.flatMap(get('rename', from), (entry) =>
        Effect.sync(() => {
          entries.delete(normalize(from))
          ensureParents(normalize(to))
          entries.set(normalize(to), entry)
        }),
      ),
  }

  return {
    layer: FileSystem.layerNoop(impl),
    read: (path) => {
      const entry = entries.get(normalize(path))
      return entry?.kind === 'file' ? decoder.decode(entry.content) : undefined
    },
    files: () =>
      [...entries]
        .filter(([, e]) => e.kind === 'file')
        .map(([path]) => path)
        .sort(),
  }
}
