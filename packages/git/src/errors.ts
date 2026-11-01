import { Data } from 'effect'

/** `git` is not installed, or not on the `PATH`. */
export class GitNotInstalled extends Data.TaggedError('GitNotInstalled')<{
  readonly detail: string
}> {
  override get message() {
    return `git is not available: ${this.detail}`
  }
}

/** The folder is not inside a git work tree. */
export class NotARepository extends Data.TaggedError('NotARepository')<{
  readonly dir: string
}> {
  override get message() {
    return `${this.dir} is not inside a git repository`
  }
}

/** A git command ran and failed. */
export class GitCommandFailed extends Data.TaggedError('GitCommandFailed')<{
  readonly args: ReadonlyArray<string>
  readonly exitCode: number
  readonly stderr: string
}> {
  override get message() {
    return `git ${this.args.join(' ')} exited with ${this.exitCode}: ${this.stderr.trim()}`
  }
}

/** A git command took too long and was stopped. */
export class GitTimeout extends Data.TaggedError('GitTimeout')<{
  readonly args: ReadonlyArray<string>
  readonly ms: number
}> {
  override get message() {
    return `git ${this.args.join(' ')} did not finish in ${this.ms} ms`
  }
}

/** The adapter was asked for a command that could change the repository. */
export class ForbiddenGitCommand extends Data.TaggedError('ForbiddenGitCommand')<{
  readonly args: ReadonlyArray<string>
  readonly reason: string
}> {
  override get message() {
    return `git ${this.args.join(' ')} is not allowed: ${this.reason}`
  }
}

/** An argument looks like an option or contains something git would read as one. */
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
