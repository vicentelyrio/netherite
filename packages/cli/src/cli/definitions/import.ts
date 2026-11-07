import { Effect, Option } from 'effect'
import { Argument, Command, Flag } from 'effect/cli'
import { importCommand } from '../../commands/import'
import type { CliContext } from '../cli.types'
import { dir, jsonFlag } from '../flags'

export const importDefinition = ({ env, finish }: CliContext) => {
  const importCmd = Command.make(
    'import',
    {
      dir,
      file: Argument.String('batch').pipe(
        Argument.withDescription(
          'A JSON file: a list of entries, or { "mode": "copy", "entries": [...] }. Each entry has source, type (doc, runbook, context or adr) and optionally title, id, fields, body and mode. `netherite scan` writes a draft of one.',
        ),
      ),
      update: Flag.Boolean('update').pipe(
        Flag.withDefault(false),
        Flag.withDescription(
          'Bring items that were already imported up to date with their source.',
        ),
      ),
      dryRun: Flag.Boolean('dry-run').pipe(
        Flag.withDefault(false),
        Flag.withDescription('Say what would happen and write nothing.'),
      ),
      stub: Flag.Boolean('stub').pipe(
        Flag.withDefault(false),
        Flag.withDescription('With mode "move", leave a one-line note where the original was.'),
      ),
      createdBy: Flag.String('created-by').pipe(
        Flag.optional,
        Flag.withDescription('@handle to record. Default: from git config.'),
      ),
      json: jsonFlag,
    },
    (c) =>
      Effect.flatMap(
        importCommand(env, {
          dir: c.dir,
          file: c.file,
          update: c.update,
          dryRun: c.dryRun,
          stub: c.stub,
          createdBy: Option.getOrUndefined(c.createdBy),
          json: c.json,
        }),
        finish,
      ),
  ).pipe(
    Command.withDescription(
      'Bring existing docs, runbooks, context files and ADRs in from a reviewed batch file. Records where each came from, skips what is already imported, and never commits.',
    ),
  )
  return importCmd
}
