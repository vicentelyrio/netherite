import { type ItemTypeName, TypeBadge } from '@netherite/ui'
import type { ReactNode } from 'react'
import { InboxRowLink, InboxRowTitle } from '../InboxRow'

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
    <InboxRowLink id={id}>
      {type && <TypeBadge type={type as ItemTypeName} />}
      <code className="kn-id">{id}</code>
      <InboxRowTitle>{title}</InboxRowTitle>
      {note && <span className="app-muted">{note}</span>}
      <span className="kn-spacer" />
      {meta}
    </InboxRowLink>
  )
}
