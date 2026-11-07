import type { ReactNode } from 'react'

export function InboxRow({ children }: { readonly children: ReactNode }) {
  return <div className="ib-row">{children}</div>
}
