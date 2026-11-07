export const defaultProgressLabel = 'Progress'

export const progressLabel = (label: string, done: number, total: number) =>
  `${label}: ${done} of ${total} done`
