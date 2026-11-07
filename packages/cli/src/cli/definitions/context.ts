import { Effect } from 'effect'
import { Command, Flag } from 'effect/cli'
import { contextSync } from '../../commands/context'
import type { CliContext } from '../cli.types'
import { dir, jsonFlag } from '../flags'

export const contextDefinition = ({ env, finish }: CliContext) => {
  const contextSyncCmd = Command.make(
    'sync',
    {
      dir,
      check: Flag.Boolean('check').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Change nothing; exit 1 if CLAUDE.md or AGENTS.md is out of date.'),
      ),
      json: jsonFlag,
    },
    (c) => Effect.flatMap(contextSync(env, c), finish),
  ).pipe(
    Command.withDescription(
      'Write the context items into CLAUDE.md and AGENTS.md, between markers. Never commits.',
    ),
  )
  const contextCmd = Command.make('context').pipe(
    Command.withDescription('Work with the context given to agents.'),
    Command.withSubcommands([contextSyncCmd]),
  )
  return contextCmd
}
