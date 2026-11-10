import type { ReactNode } from 'react'
import { SectionName, sectionProps } from '@/infrastructure/sections'
import './AppShell.css'

export interface AppShellProps {
  readonly rail: ReactNode
  readonly statusBar?: ReactNode
  readonly overlays?: ReactNode
  readonly children: ReactNode
}

export function AppShell({ rail, statusBar, overlays, children }: AppShellProps) {
  return (
    <div className="tpl-app">
      <div className="tpl-app-rail" {...sectionProps(SectionName.Sidebar)}>
        {rail}
      </div>
      <div className="tpl-app-main">
        {statusBar}
        <main className="tpl-app-content">{children}</main>
      </div>
      {overlays}
    </div>
  )
}
