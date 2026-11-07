import type { ReactNode } from 'react'

export function CardTitle({ children }: { readonly children: ReactNode }) {
  return <span className="goal-card-title">{children}</span>
}
