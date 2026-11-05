import type { ReactNode } from 'react'
import './DrawerTemplate.css'

export interface DrawerTemplateProps {
  readonly header: ReactNode
  readonly pane?: ReactNode
  readonly footer?: ReactNode
  readonly children: ReactNode
}

export function DrawerTemplate({ header, pane, footer, children }: DrawerTemplateProps) {
  return (
    <div className="tpl-drawer">
      <div className="tpl-drawer-header">{header}</div>
      <div className="tpl-drawer-split">
        {pane && <div className="tpl-drawer-pane">{pane}</div>}
        <div className="tpl-drawer-body">{children}</div>
      </div>
      {footer && <div className="tpl-drawer-footer">{footer}</div>}
    </div>
  )
}
