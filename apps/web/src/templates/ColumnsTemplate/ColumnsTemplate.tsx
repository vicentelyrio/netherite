import type { ReactNode } from 'react'
import './ColumnsTemplate.css'

export interface ColumnsTemplateProps {
  readonly header: ReactNode
  readonly children: ReactNode
}

export function ColumnsTemplate({ header, children }: ColumnsTemplateProps) {
  return (
    <div className="tpl-columns">
      <header className="tpl-columns-head">{header}</header>
      <div className="tpl-columns-scroll">{children}</div>
    </div>
  )
}
