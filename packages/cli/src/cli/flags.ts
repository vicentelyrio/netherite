import { Flag } from 'effect/cli'
import type { FailOn } from '../commands/lint'

export const dir = Flag.String('dir').pipe(
  Flag.withAlias('C'),
  Flag.withDefault('.'),
  Flag.withDescription(
    'Folder to work in (default: the current one). The workspace is found by walking up from it.',
  ),
)

export const jsonFlag = Flag.Boolean('json').pipe(
  Flag.withDefault(false),
  Flag.withDescription('Print machine-readable JSON instead of text.'),
)

export const failOnChoices: ReadonlyArray<FailOn> = ['error', 'warning', 'info', 'never']
