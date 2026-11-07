import { Constant, integer } from '../define'

export const git = {
  timeoutMs: integer(30_000, Constant, 'How long one git command may run.', { unit: 'ms', min: 1 }),
  cacheSize: integer(200, Constant, 'How many git results to keep in memory.', {
    unit: 'items',
    min: 0,
  }),
  maxPatchContext: integer(5000, Constant, 'Most context lines a diff may ask for.', { min: 0 }),
} as const
