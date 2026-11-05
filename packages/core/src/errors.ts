import type { PlatformError } from 'effect'
import { Data } from 'effect'

/** One problem in a config file, with the position in the file when it is known. */
export interface ConfigIssue {
  readonly message: string
  /** Path of the field inside the config, such as `['states', 0, 'category']`. */
  readonly path: ReadonlyArray<string | number>
  /** 1-based. */
  readonly line: number
  /** 1-based. */
  readonly column: number
}

export const formatConfigIssue = (file: string, issue: ConfigIssue) =>
  `${file}:${issue.line}:${issue.column} ${issue.message}`

/** No `.netherite/config.yml` was found in the start directory or any parent. */
export class WorkspaceNotFound extends Data.TaggedError('WorkspaceNotFound')<{
  readonly startDir: string
}> {
  override get message() {
    return `No Netherite workspace found from ${this.startDir}: no .netherite/config.yml in it or any parent directory`
  }
}

/** The config file exists but could not be read. */
export class ConfigReadError extends Data.TaggedError('ConfigReadError')<{
  readonly path: string
  readonly cause: PlatformError.PlatformError
}> {
  override get message() {
    return `Cannot read ${this.path}: ${this.cause.message}`
  }
}

/** The config file is not valid YAML, or does not match the config schema. */
export class ConfigInvalid extends Data.TaggedError('ConfigInvalid')<{
  readonly path: string
  readonly issues: ReadonlyArray<ConfigIssue>
}> {
  override get message() {
    return this.issues.map((issue) => formatConfigIssue(this.path, issue)).join('\n')
  }
}

/** An item file could not be read while scanning the workspace. */
export class ItemReadError extends Data.TaggedError('ItemReadError')<{
  readonly path: string
  readonly cause: PlatformError.PlatformError
}> {
  override get message() {
    return `Cannot read ${this.path}: ${this.cause.message}`
  }
}

export type EditFailure =
  | 'invalid-yaml'
  | 'not-a-mapping'
  | 'not-a-list'
  | 'no-such-section'
  | 'ambiguous-section'
  | 'section-exists'
  | 'no-such-check'

/** An edit could not be applied. The text it was given is left unchanged. */
export class EditError extends Data.TaggedError('EditError')<{
  readonly reason: EditFailure
  readonly detail: string
}> {
  override get message() {
    return this.detail
  }
}

/** The file changed on disk since the caller read it. Reload and try again. */
export class ConflictError extends Data.TaggedError('ConflictError')<{
  readonly path: string
  /** Hash of the content the edit was based on. */
  readonly expected: string
  /** Hash of the content found on disk, or `undefined` if the file is gone. */
  readonly actual: string | undefined
}> {
  override get message() {
    return `${this.path} changed on disk since it was read`
  }
}

/** No item has this ID. */
export class NotFound extends Data.TaggedError('NotFound')<{
  readonly id: string
}> {
  override get message() {
    return `No item has the ID ${this.id}`
  }
}

/** Several items share this ID, so it cannot say which one is meant. */
export class AmbiguousId extends Data.TaggedError('AmbiguousId')<{
  readonly id: string
  readonly paths: ReadonlyArray<string>
}> {
  override get message() {
    return `${this.id} is used by ${this.paths.length} items: ${this.paths.join(', ')}`
  }
}

/** A file already exists where one would be created. */
export class AlreadyExists extends Data.TaggedError('AlreadyExists')<{
  readonly path: string
}> {
  override get message() {
    return `${this.path} already exists`
  }
}

/** Other items still link to the one being deleted. */
export class StillLinked extends Data.TaggedError('StillLinked')<{
  readonly id: string
  readonly referrers: ReadonlyArray<{ readonly path: string; readonly kind: string }>
}> {
  override get message() {
    return `${this.id} is still linked from ${this.referrers.map((r) => r.path).join(', ')}; delete with force to remove it anyway`
  }
}

/** Reading or writing a file failed. Changes already made by the operation were rolled back. */
export class IoError extends Data.TaggedError('IoError')<{
  readonly path: string
  readonly operation: string
  readonly cause: PlatformError.PlatformError
}> {
  override get message() {
    return `Cannot ${this.operation} ${this.path}: ${this.cause.message}`
  }
}

/** The generated-block markers in an instruction file are damaged, so sync cannot tell what is generated. */
export class BadMarkers extends Data.TaggedError('BadMarkers')<{
  readonly path: string
  readonly problem: 'unclosed' | 'unopened' | 'out-of-order' | 'repeated'
}> {
  override get message() {
    const what = {
      unclosed: 'has a start marker with no end marker',
      unopened: 'has an end marker with no start marker',
      'out-of-order': 'has its end marker before its start marker',
      repeated: 'has more than one generated block',
    }[this.problem]
    return `${this.path} ${what}; fix the markers by hand and run the sync again`
  }
}
