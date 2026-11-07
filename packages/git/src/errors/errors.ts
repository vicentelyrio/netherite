import { Data } from 'effect'

export class GitNotInstalled extends Data.TaggedError('GitNotInstalled')<{
  readonly detail: string
}> {
  override get message() {
    return `git is not available: ${this.detail}`
  }
}

export class NotARepository extends Data.TaggedError('NotARepository')<{
  readonly dir: string
}> {
  override get message() {
    return `${this.dir} is not inside a git repository`
  }
}

export class GitCommandFailed extends Data.TaggedError('GitCommandFailed')<{
  readonly args: ReadonlyArray<string>
  readonly exitCode: number
  readonly stderr: string
}> {
  override get message() {
    return `git ${this.args.join(' ')} exited with ${this.exitCode}: ${this.stderr.trim()}`
  }
}

export class GitTimeout extends Data.TaggedError('GitTimeout')<{
  readonly args: ReadonlyArray<string>
  readonly ms: number
}> {
  override get message() {
    return `git ${this.args.join(' ')} did not finish in ${this.ms} ms`
  }
}

export class ForbiddenGitCommand extends Data.TaggedError('ForbiddenGitCommand')<{
  readonly args: ReadonlyArray<string>
  readonly reason: string
}> {
  override get message() {
    return `git ${this.args.join(' ')} is not allowed: ${this.reason}`
  }
}

export class InvalidGitArgument extends Data.TaggedError('InvalidGitArgument')<{
  readonly name: string
  readonly value: string
}> {
  override get message() {
    return `Invalid ${this.name}: ${this.value}`
  }
}

export type GitError =
  | GitNotInstalled
  | NotARepository
  | GitCommandFailed
  | GitTimeout
  | ForbiddenGitCommand
  | InvalidGitArgument
