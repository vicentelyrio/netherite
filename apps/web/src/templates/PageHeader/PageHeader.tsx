import type { ReactNode } from 'react'
import './PageHeader.css'

export interface PageHeaderProps {
  readonly children: ReactNode
  readonly actions?: ReactNode
}

export function PageHeader({ children, actions }: PageHeaderProps) {
  return (
    <header className="tpl-page-header">
      <div className="tpl-page-heading">{children}</div>
      {actions && <div className="tpl-page-actions">{actions}</div>}
    </header>
  )
}

export function PageToolbar({ children }: { readonly children: ReactNode }) {
  return <div className="tpl-page-toolbar">{children}</div>
}
