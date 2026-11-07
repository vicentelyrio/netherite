import { ContextTarget } from '../../enums/ContextTarget'
import { ConfigFile, integer, list } from '../define'

export const context = {
  budget: integer(8000, ConfigFile, 'Most tokens of context given to agents.', {
    locator: 'context.budget',
    unit: 'tokens',
    min: 1,
  }),
  targets: list(
    [ContextTarget.Claude, ContextTarget.Agents],
    ConfigFile,
    'Files context is synced into.',
    { locator: 'context.targets' },
  ),
} as const
