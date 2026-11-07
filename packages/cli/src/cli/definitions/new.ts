import { Effect, Option } from 'effect'
import { Argument, Command, Flag } from 'effect/cli'
import { newItem } from '../../commands/new'
import type { CliContext } from '../cli.types'
import { dir, jsonFlag } from '../flags'

export const newDefinition = ({ env, finish }: CliContext) => {
  const newCmd = Command.make(
    'new',
    {
      dir,
      type: Argument.String('type').pipe(
        Argument.withDescription('goal, project, task, adr, doc, context or runbook'),
      ),
      title: Argument.String('title').pipe(
        Argument.variadic({ min: 1 }),
        Argument.withDescription('The title; several words are joined.'),
      ),
      set: Flag.KeyValuePair('set').pipe(
        Flag.withDefault({}),
        Flag.withDescription('Set a field: --set project=PRJ-00001 (repeatable; values are YAML).'),
      ),
      body: Flag.String('body').pipe(
        Flag.optional,
        Flag.withDescription('Text for after the title.'),
      ),
      bodyFile: Flag.String('body-file').pipe(
        Flag.optional,
        Flag.withDescription('Read the text from a file.'),
      ),
      createdBy: Flag.String('created-by').pipe(
        Flag.optional,
        Flag.withDescription('@handle to record. Default: from git config.'),
      ),
      template: Flag.Boolean('template').pipe(
        Flag.withDefault(false),
        Flag.withDescription(
          "Start from the type's template, with its sections. --body and --body-file replace it.",
        ),
      ),
      json: jsonFlag,
    },
    (c) =>
      Effect.flatMap(
        newItem(env, {
          dir: c.dir,
          type: c.type,
          title: c.title,
          set: c.set,
          body: Option.getOrUndefined(c.body),
          bodyFile: Option.getOrUndefined(c.bodyFile),
          createdBy: Option.getOrUndefined(c.createdBy),
          template: c.template,
          json: c.json,
        }),
        finish,
      ),
  ).pipe(Command.withDescription('Create an item with the next free ID.'))
  return newCmd
}
