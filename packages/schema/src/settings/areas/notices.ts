import { Constant, integer } from '../define'

export const notices = {
  lifetimeMs: integer(5000, Constant, 'How long a notice stays on screen.', { unit: 'ms', min: 0 }),
  lifetimeWithActionsMs: integer(
    10_000,
    Constant,
    'How long a notice with an action stays on screen.',
    { unit: 'ms', min: 0 },
  ),
} as const
