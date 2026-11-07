import { Effect } from 'effect'
import { Command } from 'effect/cli'
import { type Env, type ExitCode, exitCodes } from '../output'
import { defaultVersion } from './defaultVersion'
import { makeCli } from './makeCli'

export const runCli = (argv: ReadonlyArray<string>, env: Env, version = defaultVersion) => {
  const state = { code: exitCodes.ok as ExitCode }
  const root = makeCli(env, state, version)
  return Command.runWith(root, { version })(argv).pipe(
    Effect.map(() => state.code),
    Effect.catch(() => Effect.succeed(exitCodes.usage as ExitCode)),
  )
}
