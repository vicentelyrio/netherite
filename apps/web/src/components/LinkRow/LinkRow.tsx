import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import './LinkRow.css'

export interface LinkRowProps {
  readonly link: {
    readonly kind: string
    readonly id?: string | undefined
    readonly title?: string | undefined
    readonly path: string
  }
  readonly action?: ReactNode
}

export function LinkRow({ link, action }: LinkRowProps) {
  return (
    <div className="link-row">
      <span className="link-row-dot" />
      {link.id ? (
        <Link to="/items/$id" params={{ id: link.id }}>
          {link.id} {link.title}
        </Link>
      ) : (
        <code>{link.path}</code>
      )}
      <span className="app-muted">{link.kind.replace('_', ' ')}</span>
      {action}
    </div>
  )
}
