import { formatConfigIssue } from '@netherite/core'
import { type Env, type ExitCode, exitCodes } from './output'

interface Tagged {
  readonly _tag: string
  readonly message: string
}

const isTagged = (value: unknown): value is Tagged =>
  typeof value === 'object' && value !== null && '_tag' in value && 'message' in value

/**
 * Prints a failure from core the way a person wants to read it, and says how the program
 * should exit: 1 when the request was understood and refused (invalid input, a conflict), 2 when
 * it could not run at all (no workspace, bad config, a file that cannot be read).
 */
export const reportFailure = (env: Env, error: unknown): ExitCode => {
  if (!isTagged(error)) throw error
  switch (error._tag) {
    case 'WorkspaceNotFound':
      env.out.error(`${error.message}`)
      env.out.error('Run `netherite init` in the repository first.')
      return exitCodes.usage as ExitCode
    case 'ConfigInvalid': {
      const issues = error as unknown as {
        path: string
        issues: Parameters<typeof formatConfigIssue>[1][]
      }
      for (const issue of issues.issues) env.out.error(formatConfigIssue(issues.path, issue))
      return exitCodes.usage as ExitCode
    }
    case 'ConfigReadError':
    case 'ItemReadError':
    case 'IoError':
    case 'WatchError':
      env.out.error(error.message)
      return exitCodes.usage as ExitCode
    case 'ValidationError': {
      const issues = (
        error as unknown as {
          issues: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>
        }
      ).issues
      for (const issue of issues) {
        env.out.error(
          issue.path.length === 0 ? issue.message : `${issue.path.join('.')}: ${issue.message}`,
        )
      }
      return exitCodes.findings as ExitCode
    }
    default:
      env.out.error(error.message)
      return exitCodes.findings as ExitCode
  }
}
