import type { ReactNode } from 'react'

export function CardBody({ children }: { readonly children: ReactNode }) {
  return <div className="goal-card">{children}</div>
}
