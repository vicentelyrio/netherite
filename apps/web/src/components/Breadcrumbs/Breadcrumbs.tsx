import { Icon } from '@netherite/ui'
import type { ReactNode } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import './Breadcrumbs.css'

export interface BreadcrumbsProps {
  readonly icon?: string
  readonly children?: ReactNode
}

export function Breadcrumbs({ icon = 'track_changes', children }: BreadcrumbsProps) {
  const { LL } = useI18nContext()
  return (
    <nav className="breadcrumbs" aria-label={LL.components.breadcrumb()}>
      <Icon name={icon} />
      {children}
    </nav>
  )
}
