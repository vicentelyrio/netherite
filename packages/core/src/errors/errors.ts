import { Data, type PlatformError } from 'effect'

export interface ConfigIssue {
  readonly message: string
  readonly path: ReadonlyArray<string | number>
  readonly line: number
  readonly column: number
}

export const formatConfigIssue = (file: string, issue: ConfigIssue) =>
  `${file}:${issue.line}:${issue.column} ${issue.message}`

export class WorkspaceNotFound extends Data.TaggedError('WorkspaceNotFound')<{
  readonly startDir: string
}> {
  override get message() {
    return `No Netherite workspace found from ${this.startDir}: no .netherite/config.yml in it or any parent directory`
  }
}

export class ConfigReadError extends Data.TaggedError('ConfigReadError')<{
  readonly path: string
  readonly cause: PlatformError.PlatformError
}> {
  override get message() {
    return `Cannot read ${this.path}: ${this.cause.message}`
  }
}

export class ConfigInvalid extends Data.TaggedError('ConfigInvalid')<{
  readonly path: string
  readonly issues: ReadonlyArray<ConfigIssue>
}> {
  override get message() {
    return this.issues.map((issue) => formatConfigIssue(this.path, issue)).join('\n')
  }
}

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

export class EditError extends Data.TaggedError('EditError')<{
  readonly reason: EditFailure
  readonly detail: string
}> {
  override get message() {
    return this.detail
  }
}

export class ConflictError extends Data.TaggedError('ConflictError')<{
  readonly path: string
  readonly expected: string
  readonly actual: string | undefined
}> {
  override get message() {
    return `${this.path} changed on disk since it was read`
  }
}

export class NotFound extends Data.TaggedError('NotFound')<{
  readonly id: string
}> {
  override get message() {
    return `No item has the ID ${this.id}`
  }
}

export class AmbiguousId extends Data.TaggedError('AmbiguousId')<{
  readonly id: string
  readonly paths: ReadonlyArray<string>
}> {
  override get message() {
    return `${this.id} is used by ${this.paths.length} items: ${this.paths.join(', ')}`
  }
}

export class AlreadyExists extends Data.TaggedError('AlreadyExists')<{
  readonly path: string
}> {
  override get message() {
    return `${this.path} already exists`
  }
}

export class StillLinked extends Data.TaggedError('StillLinked')<{
  readonly id: string
  readonly referrers: ReadonlyArray<{ readonly path: string; readonly kind: string }>
}> {
  override get message() {
    return `${this.id} is still linked from ${this.referrers.map((r) => r.path).join(', ')}; delete with force to remove it anyway`
  }
}

export class IoError extends Data.TaggedError('IoError')<{
  readonly path: string
  readonly operation: string
  readonly cause: PlatformError.PlatformError
}> {
  override get message() {
    return `Cannot ${this.operation} ${this.path}: ${this.cause.message}`
  }
}

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
