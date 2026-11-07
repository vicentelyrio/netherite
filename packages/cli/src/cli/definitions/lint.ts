import { Effect } from 'effect'
import { Argument, Command, Flag } from 'effect/cli'
import { type FailOn, lintCommand } from '../../commands/lint'
import { type ExitCode, exitCodes } from '../../output'
import type { CliContext } from '../cli.types'
import { dir, failOnChoices, jsonFlag } from '../flags'

export const lintDefinition = ({ env, finish }: CliContext) => {
  const lintCmd = Command.make(
    'lint',
    {
      dir,
      paths: Argument.String('path').pipe(
        Argument.variadic(),
        Argument.withDescription('Only report on these files or folders.'),
      ),
      json: jsonFlag,
      fix: Flag.Boolean('fix').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Apply the fixes lint offers (never commits).'),
      ),
      dryRun: Flag.Boolean('dry-run').pipe(
        Flag.withDefault(false),
        Flag.withDescription('With --fix: show the diff and change nothing.'),
      ),
      failOn: Flag.String('fail-on').pipe(
        Flag.withDefault('error'),
        Flag.withDescription(
          'Exit 1 when a problem at least this serious is left: error, warning, info or never.',
        ),
      ),
      noGit: Flag.Boolean('no-git').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Skip checks that need git history (freshness).'),
      ),
    },
    (c) => {
      if (!(failOnChoices as ReadonlyArray<string>).includes(c.failOn)) {
        env.out.error(`--fail-on must be one of ${failOnChoices.join(', ')}`)
        return finish(exitCodes.usage as ExitCode)
      }
      return Effect.flatMap(lintCommand(env, { ...c, failOn: c.failOn as FailOn }), finish)
    },
  ).pipe(
    Command.withDescription(
      'Check the workspace. Exit 0 when clean, 1 when problems remain, 2 when it cannot run.',
    ),
  )
  return lintCmd
}
