import type { ReactNode } from 'react'

export function InboxRowTitle({ children }: { readonly children: ReactNode }) {
  return <span className="ib-title">{children}</span>
}
