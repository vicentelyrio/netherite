import { Effect, Option } from 'effect'
import { Command, Flag } from 'effect/cli'
import { scanCommand } from '../../commands/scan'
import type { CliContext } from '../cli.types'
import { dir, jsonFlag } from '../flags'

export const scanDefinition = ({ env, finish }: CliContext) => {
  const scanCmd = Command.make(
    'scan',
    {
      dir,
      out: Flag.String('out').pipe(
        Flag.optional,
        Flag.withDescription(
          'Where to write the draft batch, from the workspace root. Default: .netherite/local/scan.json.',
        ),
      ),
      nestedAgentFiles: Flag.Boolean('nested-agent-files').pipe(
        Flag.withDefault(false),
        Flag.withDescription(
          'Include the AGENTS.md and CLAUDE.md files deep in the tree. They are left out by default: agents read them in place, and they would fill the context budget.',
        ),
      ),
      force: Flag.Boolean('force').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Replace a draft that is already there.'),
      ),
      json: jsonFlag,
    },
    (c) =>
      Effect.flatMap(
        scanCommand(env, {
          dir: c.dir,
          out: Option.getOrUndefined(c.out),
          nestedAgentFiles: c.nestedAgentFiles,
          force: c.force,
          json: c.json,
        }),
        finish,
      ),
  ).pipe(
    Command.withDescription(
      'Look through the repository for docs, runbooks, decision records and agent files, and write a draft batch for `netherite import`. It only reads, and writes nothing but the draft.',
    ),
  )
  return scanCmd
}
