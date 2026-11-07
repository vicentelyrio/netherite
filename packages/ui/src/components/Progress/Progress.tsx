import { Progress as MantineProgress } from '@mantine/core'
import { useUiLabels } from '../UiLabels'
import type { ProgressProps } from './Progress.types'
import { percentOf } from './percentOf'

const barHeight = 6
const barColor = 'success'

export function Progress({ done, total, label }: ProgressProps) {
  const labels = useUiLabels()
  return (
    <MantineProgress
      value={percentOf(done, total)}
      size={barHeight}
      color={barColor}
      aria-label={labels.progressOf(label ?? labels.progress, done, total)}
    />
  )
}
