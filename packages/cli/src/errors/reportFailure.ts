import { formatConfigIssue } from '@netherite/core'
import { type Env, type ExitCode, exitCodes } from '../output'

interface Tagged {
  readonly _tag: string
  readonly message: string
}

type Reporter = (env: Env, error: Tagged) => ExitCode

const isTagged = (value: unknown): value is Tagged =>
  typeof value === 'object' && value !== null && '_tag' in value && 'message' in value

const plainUsage: Reporter = (env, error) => {
  env.out.error(error.message)
  return exitCodes.usage as ExitCode
}

const reporters: Readonly<Record<string, Reporter>> = {
  WorkspaceNotFound: (env, error) => {
    env.out.error(`${error.message}`)
    env.out.error('Run `netherite init` in the repository first.')
    return exitCodes.usage as ExitCode
  },
  ConfigInvalid: (env, error) => {
    const issues = error as unknown as {
      path: string
      issues: Parameters<typeof formatConfigIssue>[1][]
    }
    for (const issue of issues.issues) env.out.error(formatConfigIssue(issues.path, issue))
    return exitCodes.usage as ExitCode
  },
  ConfigReadError: plainUsage,
  ItemReadError: plainUsage,
  IoError: plainUsage,
  WatchError: plainUsage,
  ServeError: plainUsage,
  NotLoopback: plainUsage,
  PortInUse: plainUsage,
  ValidationError: (env, error) => {
    const { issues } = error as unknown as {
      issues: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>
    }
    for (const issue of issues) {
      env.out.error(
        issue.path.length === 0 ? issue.message : `${issue.path.join('.')}: ${issue.message}`,
      )
    }
    return exitCodes.findings as ExitCode
  },
}

const otherError: Reporter = (env, error) => {
  env.out.error(error.message)
  return exitCodes.findings as ExitCode
}

export const reportFailure = (env: Env, error: unknown): ExitCode => {
  if (!isTagged(error)) throw error
  return (reporters[error._tag] ?? otherError)(env, error)
}
