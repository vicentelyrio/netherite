import type { ReactNode } from 'react'

export function CardOverline({ children }: { readonly children: ReactNode }) {
  return <span className="goal-overline">{children}</span>
}
