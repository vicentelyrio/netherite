import { type ParsedMarkdown, parseMarkdown } from '@netherite/markdown'
import { Effect, FileSystem, Path } from 'effect'
import { ItemReadError } from './errors'
import type { Workspace } from './workspace'

/** A Markdown file under the content root, parsed, with the identity fields read from its frontmatter. */
export interface ScannedItem {
  /** Path relative to the workspace root, with `/` separators. */
  readonly path: string
  /** File name without `.md`. */
  readonly fileName: string
  readonly parsed: ParsedMarkdown
  /** From the frontmatter. Missing or mistyped fields are `undefined` or empty here; lint reports them. */
  readonly id: string | undefined
  readonly aliases: ReadonlyArray<string>
  readonly title: string | undefined
  readonly type: string | undefined
}

const asString = (value: unknown) => (typeof value === 'string' ? value : undefined)

export const toScannedItem = (path: string, source: string): ScannedItem => {
  const parsed = parseMarkdown(source)
  const data = parsed.frontmatter?.data
  const fields = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  const name = path.slice(path.lastIndexOf('/') + 1)
  return {
    path,
    fileName: name.replace(/\.md$/i, ''),
    parsed,
    id: asString(fields.id),
    aliases: Array.isArray(fields.aliases)
      ? fields.aliases.filter((a) => typeof a === 'string')
      : [],
    title: asString(fields.title),
    type: asString(fields.type),
  }
}

const skipped = (relative: string) =>
  relative.split('/').some((part) => part.startsWith('.')) || relative.split('/')[0] === 'assets'

/**
 * Reads every Markdown file under the content root, except hidden folders and `assets/`.
 * Files with broken frontmatter are still returned, so lint can report them.
 */
export const scanItems = (workspace: Pick<Workspace, 'root' | 'contentRoot'>) =>
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

    return yield* Effect.forEach(
      files,
      (entry) => {
        const absolute = path.join(workspace.contentRoot, entry)
        const relative = path.relative(workspace.root, absolute).split(path.sep).join('/')
        return fs.readFileString(absolute).pipe(
          Effect.mapError((cause) => new ItemReadError({ path: absolute, cause })),
          Effect.map((source) => toScannedItem(relative, source)),
        )
      },
      { concurrency: 32 },
    )
  })
