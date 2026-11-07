import type { ReactNode } from 'react'
import './PageHeader.css'

export function PageToolbar({ children }: { readonly children: ReactNode }) {
  return <div className="tpl-page-toolbar">{children}</div>
}
