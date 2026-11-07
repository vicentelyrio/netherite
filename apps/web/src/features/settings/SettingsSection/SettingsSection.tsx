import type { ReactNode } from 'react'
import './SettingsSection.css'

export function SettingsSection({
  title,
  subtitle,
  children,
}: {
  readonly title: string
  readonly subtitle: string
  readonly children: ReactNode
}) {
  return (
    <section className="ss" aria-label={title}>
      <header>
        <h2 className="ss-title">{title}</h2>
        <p className="app-muted">{subtitle}</p>
      </header>
      <div className="ss-card">{children}</div>
    </section>
  )
}
