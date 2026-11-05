import type { ReactNode } from 'react'
import './PageHeader.css'

export interface PageHeaderProps {
  /** Breadcrumb, title and subtitle. */
  readonly children: ReactNode
  /** Actions at the right of the header. */
  readonly actions?: ReactNode
}

/** The top of a page: the heading on the left, actions on the right. */
export function PageHeader({ children, actions }: PageHeaderProps) {
  return (
    <header className="tpl-page-header">
      <div className="tpl-page-heading">{children}</div>
      {actions && <div className="tpl-page-actions">{actions}</div>}
    </header>
  )
}

/** The row of filters and view switches under a page header. */
export function PageToolbar({ children }: { readonly children: ReactNode }) {
  return <div className="tpl-page-toolbar">{children}</div>
}
