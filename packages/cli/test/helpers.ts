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

export interface Serving {
  readonly url: string
  readonly token: string
  readonly stdout: string[]
  readonly stderr: string[]
  /** URLs the command asked the browser to open. */
  readonly opened: string[]
  /** Stops the server like Ctrl-C and resolves to the exit code. */
  readonly stop: () => Promise<number>
}

/** Runs `netherite serve` (or whatever command is given) in-process and waits until it is listening. */
export const serving = async (cwd: string, ...argv: string[]): Promise<Serving> => {
  const stdout: string[] = []
  const stderr: string[] = []
  const opened: string[] = []
  const controller = new AbortController()
  const done = Effect.runPromise(
    runCli(argv, {
      cwd,
      out: { line: (t) => void stdout.push(t), error: (t) => void stderr.push(t) },
      serve: { signal: controller.signal, open: (url) => void opened.push(url) },
    }).pipe(Effect.provide(NodeServices.layer)),
  )
  const started = Date.now()
  while (!stdout.some((l) => l.includes('is running at'))) {
    if (Date.now() - started > 8000) {
      controller.abort()
      throw new Error(`serve did not start: ${stdout.join('\n')} ${stderr.join('\n')}`)
    }
    await new Promise((r) => setTimeout(r, 20))
  }
  const url = /running at (http:\/\/\S+)/.exec(stdout.join('\n'))?.[1] as string
  const token = /Bearer ([0-9a-f]{64})/.exec(stdout.join('\n'))?.[1] as string
  return {
    url,
    token,
    stdout,
    stderr,
    opened,
    stop: () => {
      controller.abort()
      return done
    },
  }
}
