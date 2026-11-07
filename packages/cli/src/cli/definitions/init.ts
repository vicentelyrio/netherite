import { settingDefaults } from '@netherite/core'
import { Effect } from 'effect'
import { Command, Flag } from 'effect/cli'
import { init } from '../../commands/init'
import type { CliContext } from '../cli.types'
import { dir, jsonFlag } from '../flags'

export const initDefinition = ({ env, finish }: CliContext) => {
  const initCmd = Command.make(
    'init',
    {
      dir,
      content: Flag.String('content').pipe(
        Flag.withDefault(settingDefaults.content.folder),
        Flag.withDescription('Folder for the items.'),
      ),
      update: Flag.Boolean('update').pipe(
        Flag.withDefault(false),
        Flag.withDescription(
          'Refresh the installed agent skills and AGENTS.md section. Skills you edited are kept.',
        ),
      ),
      noSkills: Flag.Boolean('no-skills').pipe(
        Flag.withDefault(false),
        Flag.withDescription(
          'Do not install agent skills, the AGENTS.md section or the agent ruleset.',
        ),
      ),
      json: jsonFlag,
    },
    (c) => Effect.flatMap(init(env, c), finish),
  ).pipe(
    Command.withDescription(
      'Set up Netherite in a repository: config, folders, .gitignore and agent skills.',
    ),
  )
  return initCmd
}
