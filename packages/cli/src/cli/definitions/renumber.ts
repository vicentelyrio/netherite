import { Effect, Option } from 'effect'
import { Argument, Command, Flag } from 'effect/cli'
import { renumberCommand } from '../../commands/renumber'
import type { CliContext } from '../cli.types'
import { dir, jsonFlag } from '../flags'

export const renumberDefinition = ({ env, finish }: CliContext) => {
  const renumberCmd = Command.make(
    'renumber',
    {
      dir,
      target: Argument.String('item').pipe(Argument.withDescription('Path or ID of an item.')),
      to: Flag.String('to').pipe(
        Flag.optional,
        Flag.withDescription('Use this ID instead of the next free one.'),
      ),
      rewriteIn: Flag.String('rewrite-in').pipe(
        Flag.atLeast(0),
        Flag.withDescription('A file whose links to the old ID should follow it (repeatable).'),
      ),
      exact: Flag.Boolean('exact').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Renumber exactly this item, not the newest one that shares its ID.'),
      ),
      json: jsonFlag,
    },
    (c) =>
      Effect.flatMap(
        renumberCommand(env, {
          dir: c.dir,
          target: c.target,
          to: Option.getOrUndefined(c.to),
          rewriteIn: c.rewriteIn,
          exact: c.exact,
          json: c.json,
        }),
        finish,
      ),
  ).pipe(
    Command.withDescription(
      'Give an item a new ID and update links to it. Resolves ID collisions after a merge.',
    ),
  )
  return renumberCmd
}
