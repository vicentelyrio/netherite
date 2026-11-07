import { Progress as MantineProgress } from '@mantine/core'
import type { ProgressProps } from './Progress.types'
import { percentOf } from './percentOf'
import { defaultProgressLabel, progressLabel } from './progressLabel'

const barHeight = 6
const barColor = 'success'

export function Progress({ done, total, label = defaultProgressLabel }: ProgressProps) {
  return (
    <MantineProgress
      value={percentOf(done, total)}
      size={barHeight}
      color={barColor}
      aria-label={progressLabel(label, done, total)}
    />
  )
}
