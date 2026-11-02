import type { ReactNode } from 'react'
import './DrawerTemplate.css'

export interface DrawerTemplateProps {
  /** The top bar: path, change badge, close. */
  readonly header: ReactNode
  /** An optional pane beside the body (the code pane). */
  readonly pane?: ReactNode
  /** The status bar at the bottom. */
  readonly footer?: ReactNode
  readonly children: ReactNode
}

/** A panel that slides over a screen: a header, a body with an optional pane, a status bar. */
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
