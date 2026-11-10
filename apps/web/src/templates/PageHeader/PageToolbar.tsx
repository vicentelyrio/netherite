import type { ReactNode } from 'react'
import { SectionName, sectionProps } from '@/infrastructure/sections'
import './PageHeader.css'

export function PageToolbar({ children }: { readonly children: ReactNode }) {
  return (
    <div className="tpl-page-toolbar" {...sectionProps(SectionName.Toolbar)}>
      {children}
    </div>
  )
}
