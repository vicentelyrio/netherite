import { Effect, Option } from 'effect'
import { Argument, Command } from 'effect/cli'
import { templatesCommand } from '../../commands/templates'
import type { CliContext } from '../cli.types'
import { dir, jsonFlag } from '../flags'

export const templatesDefinition = ({ env, finish }: CliContext) => {
  const templatesCmd = Command.make(
    'templates',
    {
      dir,
      type: Argument.String('type').pipe(
        Argument.optional,
        Argument.withDescription(
          'goal, project, task, adr, doc, context or runbook. Without it, list them.',
        ),
      ),
      json: jsonFlag,
    },
    (c) =>
      Effect.flatMap(
        templatesCommand(env, { dir: c.dir, type: Option.getOrUndefined(c.type), json: c.json }),
        finish,
      ),
  ).pipe(
    Command.withDescription(
      'List the starter templates, or print one to copy. A file in templates/ in the content folder replaces the built-in one.',
    ),
  )
  return templatesCmd
}
