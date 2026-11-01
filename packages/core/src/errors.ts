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
