import { execFileSync } from 'node:child_process'
import { devNull } from 'node:os'
import { NodeServices } from '@effect/platform-node'
import { Effect } from 'effect'
import { runCli } from '../src/index'

export interface Result {
  readonly code: number
  readonly stdout: string[]
  readonly stderr: string[]
  /** stdout as one string. */
  readonly text: string
}

/** Runs the CLI in-process in `cwd`, collecting what it prints. */
export const cli = async (cwd: string, ...argv: string[]): Promise<Result> => {
  const stdout: string[] = []
  const stderr: string[] = []
  const code = await Effect.runPromise(
    runCli(argv, {
      cwd,
      out: { line: (t) => void stdout.push(t), error: (t) => void stderr.push(t) },
    }).pipe(Effect.provide(NodeServices.layer)),
  )
  return { code, stdout, stderr, text: stdout.join('\n') }
}

export const isolateGit = () => {
  process.env.GIT_CONFIG_GLOBAL = devNull
  process.env.GIT_CONFIG_SYSTEM = devNull
}

export const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

export const json = <T = unknown>(result: Result): T => JSON.parse(result.text) as T
