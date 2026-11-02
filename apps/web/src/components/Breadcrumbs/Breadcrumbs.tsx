import { Icon } from '@netherite/ui'
import type { ReactNode } from 'react'
import './Breadcrumbs.css'

export interface BreadcrumbsProps {
  /** The Material Symbols name of the section's icon. */
  readonly icon?: string
  /** Links, separators and the current page, in order. */
  readonly children?: ReactNode
}

/** Where the person is: the section's icon, then the path to this page. */
export function Breadcrumbs({ icon = 'track_changes', children }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Icon name={icon} />
      {children}
    </nav>
  )
}
