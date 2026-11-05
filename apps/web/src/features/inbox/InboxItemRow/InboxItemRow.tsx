import { type ItemTypeName, TypeBadge } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import '../shared.css'

/** A row in an Inbox group: an item, with a note and something at the end. */
export function InboxItemRow({
  id,
  title,
  type,
  note,
  meta,
}: {
  readonly id: string
  readonly title: string
  readonly type?: string | undefined
  readonly note?: string
  readonly meta?: ReactNode
}) {
  return (
    <Link to="/items/$id" params={{ id }} className="ib-row">
      {type && <TypeBadge type={type as ItemTypeName} />}
      <code className="kn-id">{id}</code>
      <span className="ib-title">{title}</span>
      {note && <span className="app-muted">{note}</span>}
      <span className="kn-spacer" />
      {meta}
    </Link>
  )
}
