import { Icon } from '@netherite/ui'
import type { ReactNode } from 'react'
import './GroupCard.css'

export interface GroupCardProps {
  readonly title?: string
  readonly icon?: string
  readonly count?: number
  readonly label?: string
  readonly className?: string
  readonly children: ReactNode
}

export function GroupCard({ title, icon, count, label, className, children }: GroupCardProps) {
  if (count === 0) return null
  return (
    <section
      className={className ? `group-card ${className}` : 'group-card'}
      aria-label={label ?? title}
    >
      {title !== undefined && (
        <div className="group-card-head">
          {icon && <Icon name={icon} size={16} />}
          <strong>{title}</strong>
          {count !== undefined && <span>{count}</span>}
        </div>
      )}
      {children}
    </section>
  )
}
