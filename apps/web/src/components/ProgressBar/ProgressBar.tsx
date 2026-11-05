import { Progress } from '@netherite/ui'
import './ProgressBar.css'

export interface ProgressBarProps {
  readonly done: number
  readonly total: number
  readonly label?: string
}

export function ProgressBar({ done, total, label }: ProgressBarProps) {
  return (
    <div className="progress-bar">
      <Progress done={done} total={total} {...(label ? { label } : {})} />
      <span className="progress-bar-count" data-done={(total > 0 && done === total) || undefined}>
        {done}/{total}
      </span>
    </div>
  )
}
