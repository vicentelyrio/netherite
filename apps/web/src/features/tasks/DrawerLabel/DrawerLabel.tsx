import type { ReactNode } from 'react'
import './DrawerLabel.css'

export function DrawerLabel({ children }: { readonly children: ReactNode }) {
  return <span className="drawer-cell-label">{children}</span>
}
