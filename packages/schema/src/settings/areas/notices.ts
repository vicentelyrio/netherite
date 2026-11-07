import { Browser, Constant, integer } from '../define'

export const notices = {
  lifetimeMs: integer(5000, Browser, 'How long a notice stays on screen.', {
    locator: 'netherite.settings',
    unit: 'ms',
    min: 1000,
    max: 60_000,
  }),
  lifetimeWithActionsMs: integer(
    10_000,
    Constant,
    'The shortest time a notice with an action stays on screen.',
    { unit: 'ms', min: 0 },
  ),
} as const
