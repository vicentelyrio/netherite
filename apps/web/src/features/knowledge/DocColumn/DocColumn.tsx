import type { ReactNode } from 'react'
import './DocColumn.css'

export function DocColumn({ children }: { readonly children: ReactNode }) {
  return <div className="kf-main">{children}</div>
}
