import { Icon } from '@netherite/ui'
import type { ReactNode } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import './Breadcrumbs.css'

export interface BreadcrumbsProps {
  /** The Material Symbols name of the section's icon. */
  readonly icon?: string
  /** Links, separators and the current page, in order. */
  readonly children?: ReactNode
}

/** Where the person is: the section's icon, then the path to this page. */
export function Breadcrumbs({ icon = 'track_changes', children }: BreadcrumbsProps) {
  const { LL } = useI18nContext()
  return (
    <nav className="breadcrumbs" aria-label={LL.components.breadcrumb()}>
      <Icon name={icon} />
      {children}
    </nav>
  )
}
