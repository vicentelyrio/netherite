import { Icon } from '@netherite/ui'
import type { ReactNode } from 'react'
import '../shared.css'
import './StaleWarning.css'

export function StaleWarning({
  title,
  detail,
  actions,
}: {
  readonly title: string
  readonly detail: string
  readonly actions?: ReactNode
}) {
  return (
    <div className="kf-warning">
      <Icon name="warning" size={20} filled />
      <div className="kf-warning-text">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      {actions}
    </div>
  )
}
