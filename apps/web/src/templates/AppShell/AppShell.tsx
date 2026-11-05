import type { ReactNode } from 'react'
import './AppShell.css'

export interface AppShellProps {
  /** The navigation rail. */
  readonly rail: ReactNode
  /** The thin bar above the screen (connection state, counts). */
  readonly statusBar?: ReactNode
  /** Overlays that sit above the screen (search, notices). */
  readonly overlays?: ReactNode
  readonly children: ReactNode
}

/** The frame of the app: the rail on the left, a status bar, and the current screen. */
export function AppShell({ rail, statusBar, overlays, children }: AppShellProps) {
  return (
    <div className="tpl-app">
      {rail}
      <div className="tpl-app-main">
        {statusBar}
        <main className="tpl-app-content">{children}</main>
      </div>
      {overlays}
    </div>
  )
}
