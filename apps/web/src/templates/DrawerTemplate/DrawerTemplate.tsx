import type { ReactNode } from 'react'
import { SectionName, sectionProps } from '@/infrastructure/sections'
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
      <div className="tpl-drawer-header" {...sectionProps(SectionName.Header)}>
        {header}
      </div>
      <div className="tpl-drawer-split">
        {pane && (
          <div className="tpl-drawer-pane" {...sectionProps(SectionName.Side)}>
            {pane}
          </div>
        )}
        <div className="tpl-drawer-body" {...sectionProps(SectionName.Content)}>
          {children}
        </div>
      </div>
      {footer && (
        <div className="tpl-drawer-footer" {...sectionProps(SectionName.Footer)}>
          {footer}
        </div>
      )}
    </div>
  )
}
