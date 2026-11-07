import type { ReactNode } from 'react'

export function PreviewSection({
  title,
  children,
}: {
  readonly title: string
  readonly children: ReactNode
}) {
  return (
    <section className="nt-preview-section">
      <h2 className="nt-overline nt-preview-title">{title}</h2>
      {children}
    </section>
  )
}
