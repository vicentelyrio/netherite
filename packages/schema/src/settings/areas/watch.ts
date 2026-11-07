import { Constant, integer } from '../define'

export const watch = {
  debounceMs: integer(100, Constant, 'Wait after a file changes before reacting.', {
    unit: 'ms',
    min: 0,
  }),
} as const
