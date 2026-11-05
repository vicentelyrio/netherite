import type { ReactNode } from 'react'
import './ChartCard.css'

export function ChartCard({
  title,
  subtitle,
  aside,
  children,
}: {
  readonly title: string
  readonly subtitle?: string
  readonly aside?: ReactNode
  readonly children: ReactNode
}) {
  return (
    <section className="st-card" aria-label={title}>
      {aside === undefined && subtitle === undefined ? (
        <h2 className="st-h">{title}</h2>
      ) : (
        <header className="st-card-head">
          <div className="st-card-titles">
            <h2 className="st-h">{title}</h2>
            {subtitle !== undefined && <span className="st-sub">{subtitle}</span>}
          </div>
          {aside}
        </header>
      )}
      {children}
    </section>
  )
}
