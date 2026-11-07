import { Icon } from '@netherite/ui'
import type { ReactNode } from 'react'
import './NewItemButton.css'

export function NewItemButton({
  className,
  onClick,
  children,
}: {
  readonly className?: string
  readonly onClick: () => void
  readonly children: ReactNode
}) {
  return (
    <button
      type="button"
      className={className ? `goals-new ${className}` : 'goals-new'}
      onClick={onClick}
    >
      <Icon name="add" /> {children}
    </button>
  )
}
