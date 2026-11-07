import { Icon } from '@netherite/ui'
import type { ReactNode } from 'react'
import './NoLinks.css'

export function NoLinks({ children }: { readonly children: ReactNode }) {
  return (
    <div className="kn-none">
      <Icon name="link_off" size={15} /> {children}
    </div>
  )
}
