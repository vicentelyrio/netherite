import type { ReactNode } from 'react'
import { SectionName, sectionProps } from '@/infrastructure/sections'
import './ColumnsTemplate.css'

export interface ColumnsTemplateProps {
  readonly header: ReactNode
  readonly children: ReactNode
}

export function ColumnsTemplate({ header, children }: ColumnsTemplateProps) {
  return (
    <div className="tpl-columns">
      <header className="tpl-columns-head" {...sectionProps(SectionName.Header)}>
        {header}
      </header>
      <div className="tpl-columns-scroll" {...sectionProps(SectionName.Content)}>
        {children}
      </div>
    </div>
  )
}
