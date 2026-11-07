import { Failure, Invalid, Unavailable } from '@netherite/api'

export const invalid = (path: ReadonlyArray<string | number>, message: string) =>
  new Invalid({ message, issues: [{ path: [...path], message }] })

export const noGit = () =>
  new Unavailable({ message: 'This workspace is not in a git repository.' })

export const gitFailure = (e: unknown) =>
  new Failure({
    message: e instanceof Error ? e.message : String((e as { message?: string }).message ?? e),
  })
