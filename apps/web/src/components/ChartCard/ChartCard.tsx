import type { ReactNode } from 'react'
import './ChartCard.css'

/** A card for one chart: its title, something at the end of the title row, then the chart. */
export function ChartCard({
  title,
  aside,
  children,
}: {
  readonly title: string
  readonly aside?: ReactNode
  readonly children: ReactNode
}) {
  return (
    <section className="st-card" aria-label={title}>
      {aside === undefined ? (
        <h2 className="st-h">{title}</h2>
      ) : (
        <header className="st-card-head">
          <h2 className="st-h">{title}</h2>
          {aside}
        </header>
      )}
      {children}
    </section>
  )
}
