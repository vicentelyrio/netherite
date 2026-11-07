import type { ReactNode } from 'react'
import './DrawerSection.css'

export function DrawerSection({
  label,
  children,
}: {
  readonly label: string
  readonly children: ReactNode
}) {
  return (
    <section className="drawer-section" aria-label={label}>
      {children}
    </section>
  )
}
