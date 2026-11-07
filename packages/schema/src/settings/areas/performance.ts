import { Constant, integer } from '../define'

export const performance = {
  parsePoolThreshold: integer(400, Constant, 'Files before parsing moves to worker threads.', {
    unit: 'files',
    min: 1,
  }),
  parsePoolFilesPerWorker: integer(150, Constant, 'Files that justify one more worker.', {
    unit: 'files',
    min: 1,
  }),
} as const
