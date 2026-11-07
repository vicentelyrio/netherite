import type { ReactNode } from 'react'
import './PanelSection.css'

export function PanelSection({
  title,
  label,
  children,
}: {
  readonly title: ReactNode
  readonly label?: string
  readonly children: ReactNode
}) {
  return (
    <section className="kf-section" {...(label === undefined ? {} : { 'aria-label': label })}>
      <h2 className="kf-h">{title}</h2>
      {children}
    </section>
  )
}
