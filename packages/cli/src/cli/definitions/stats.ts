import { Effect } from 'effect'
import { Command, Flag } from 'effect/cli'
import { statsCommand } from '../../commands/progress'
import type { CliContext } from '../cli.types'
import { dir, jsonFlag } from '../flags'

export const statsDefinition = ({ env, finish }: CliContext) => {
  const statsCmd = Command.make(
    'stats',
    {
      dir,
      period: Flag.String('period').pipe(
        Flag.withDefault('30d'),
        Flag.withDescription('30d, quarter or year.'),
      ),
      json: jsonFlag,
    },
    (c) => Effect.flatMap(statsCommand(env, c), finish),
  ).pipe(
    Command.withDescription(
      'Tasks created and done, cycle time, goal areas and knowledge health for a period, against the one before. Needs git.',
    ),
  )
  return statsCmd
}
