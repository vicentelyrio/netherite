import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export function InboxRowLink({
  id,
  children,
}: {
  readonly id: string
  readonly children: ReactNode
}) {
  return (
    <Link to="/items/$id" params={{ id }} className="ib-row">
      {children}
    </Link>
  )
}
