import { Effect, Option } from 'effect'
import { Command, Flag } from 'effect/cli'
import { timelineCommand } from '../../commands/progress'
import type { CliContext } from '../cli.types'
import { dir, jsonFlag } from '../flags'

export const timelineDefinition = ({ env, finish }: CliContext) => {
  const timelineCmd = Command.make(
    'timeline',
    {
      dir,
      from: Flag.String('from').pipe(
        Flag.optional,
        Flag.withDescription('First day, such as 2026-01-01. Default: the earliest date.'),
      ),
      to: Flag.String('to').pipe(
        Flag.optional,
        Flag.withDescription('Last day. Default: today, or the latest due date.'),
      ),
      json: jsonFlag,
    },
    (c) =>
      Effect.flatMap(
        timelineCommand(env, {
          dir: c.dir,
          from: Option.getOrUndefined(c.from),
          to: Option.getOrUndefined(c.to),
          json: c.json,
        }),
        finish,
      ),
  ).pipe(
    Command.withDescription(
      'Goals, projects, tasks and decisions on one time axis, read from git history. Needs git.',
    ),
  )
  return timelineCmd
}
