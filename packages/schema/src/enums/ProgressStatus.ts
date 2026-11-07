export const ProgressStatus = {
  Backlog: 'backlog',
  Progress: 'progress',
  Hold: 'hold',
  Done: 'done',
} as const

export type ProgressStatus = (typeof ProgressStatus)[keyof typeof ProgressStatus]
