import type { ReactNode } from 'react'

export function DrawerHeading({ children }: { readonly children: ReactNode }) {
  return <h3 className="drawer-h">{children}</h3>
}
