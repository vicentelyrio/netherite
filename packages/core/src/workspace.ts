import { type Config, Config as ConfigSchema, validate } from '@netherite/schema'
import { Effect, FileSystem, Path } from 'effect'
import { type Document, isNode, LineCounter, parseDocument } from 'yaml'
import { ConfigInvalid, type ConfigIssue, ConfigReadError, WorkspaceNotFound } from './errors'

/** Location of the config file, relative to the workspace root. */
export const configFile = '.netherite/config.yml'

export interface Workspace {
  /** Absolute path of the repository root: the directory that holds `.netherite/`. */
  readonly root: string
  /** Absolute path of `.netherite/config.yml`. */
  readonly configPath: string
  /** Absolute path of the folder that holds the items (`content` in the config). */
  readonly contentRoot: string
  /** The config with every default applied. */
  readonly config: Config
}

/**
 * Finds the workspace root by walking up from `startDir` to the first directory that contains
 * `.netherite/config.yml`.
 */
export const findWorkspaceRoot = (startDir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    let dir = path.resolve(startDir)
    while (true) {
      const found = yield* fs
        .exists(path.join(dir, configFile))
        .pipe(Effect.orElseSucceed(() => false))
      if (found) return dir
      const parent = path.dirname(dir)
      if (parent === dir) return yield* new WorkspaceNotFound({ startDir })
      dir = parent
    }
  })

type Locate = (path: ReadonlyArray<string | number>) => { line: number; column: number }

const makeLocate =
  (doc: Document.Parsed, lineCounter: LineCounter): Locate =>
  (path) => {
    for (let length = path.length; length >= 0; length--) {
      const node = length === 0 ? doc.contents : doc.getIn(path.slice(0, length), true)
      if (isNode(node) && node.range) {
        const { line, col } = lineCounter.linePos(node.range[0])
        return { line, column: col }
      }
    }
    return { line: 1, column: 1 }
  }

const parseWithLocator = (text: string, file: string) =>
  Effect.gen(function* () {
    const lineCounter = new LineCounter()
    const doc = parseDocument(text, { lineCounter })
    const locate = makeLocate(doc, lineCounter)

    if (doc.errors.length > 0) {
      return yield* new ConfigInvalid({
        path: file,
        issues: doc.errors.map((error) => ({
          message: error.message.split('\n')[0] ?? error.message,
          path: [],
          line: error.linePos?.[0].line ?? 1,
          column: error.linePos?.[0].col ?? 1,
        })),
      })
    }

    const value: unknown = doc.toJS()
    const config = yield* validate(ConfigSchema)(value ?? {}).pipe(
      Effect.mapError(
        (error) =>
          new ConfigInvalid({
            path: file,
            issues: error.issues.map(
              (issue): ConfigIssue => ({
                message: issue.message,
                path: issue.path,
                ...locate(issue.path),
              }),
            ),
          }),
      ),
    )
    return { config, locate }
  })

/**
 * Parses and validates config text. Fails with every YAML syntax error, or every schema error,
 * each with the line and column in the file.
 */
export const parseConfig = (text: string, file: string) =>
  Effect.map(parseWithLocator(text, file), ({ config }) => config)

/** Reads, parses and validates the config of the workspace at `root`. */
export const loadWorkspace = (root: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const configPath = path.join(root, configFile)

    const text = yield* fs
      .readFileString(configPath)
      .pipe(Effect.mapError((cause) => new ConfigReadError({ path: configPath, cause })))
    const { config, locate } = yield* parseWithLocator(text, configPath)

    const contentRoot = path.resolve(root, config.content)
    const relative = path.relative(root, contentRoot)
    if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
      return yield* new ConfigInvalid({
        path: configPath,
        issues: [
          {
            message: `"content" must be a folder inside the repository, not "${config.content}"`,
            path: ['content'],
            ...locate(['content']),
          },
        ],
      })
    }

    return { root, configPath, contentRoot, config } satisfies Workspace
  })

/** Finds the workspace from `startDir` and loads it. */
export const openWorkspace = (startDir: string) =>
  Effect.flatMap(findWorkspaceRoot(startDir), loadWorkspace)
