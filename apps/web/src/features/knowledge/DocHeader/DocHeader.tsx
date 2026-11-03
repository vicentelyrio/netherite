import type { ItemDetail } from '@netherite/api'
import { Button, Icon, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { useNavigate } from '@tanstack/react-router'
import type { ReviewAction } from '../DocMain'
import './DocHeader.css'

/** The top bar of the doc view: the file's path, its type, unsaved changes, review and close. */
export function DocHeader({
  item,
  stale,
  changedLines,
  review,
}: {
  readonly item: ItemDetail
  readonly stale: boolean
  readonly changedLines: number
  readonly review: ReviewAction
}) {
  const navigate = useNavigate()
  const type = item.type as ItemTypeName
  const folder = item.path.split('/').slice(-2, -1)[0] ?? ''
  const file = item.path.split('/').at(-1) ?? item.id
  return (
    <header className="kf-head">
      <Icon name="stacks" size={16} />
      <nav className="kf-path" aria-label="File path">
        <span>Knowledge</span> › <span>{folder}</span> › <strong>{file}</strong>
      </nav>
      <TypeBadge type={type} />
      {changedLines > 0 && (
        <span className="kf-lines">
          M {changedLines} {changedLines === 1 ? 'line' : 'lines'} changed
        </span>
      )}
      <code className="app-id kf-id">{item.id}</code>
      <span className="kf-spacer" />
      {!stale && (type === 'doc' || type === 'runbook' || type === 'context') && (
        <Button size="sm" icon="done_all" loading={review.pending} onClick={review.run}>
          Mark reviewed
        </Button>
      )}
      <button
        type="button"
        className="kf-close"
        aria-label="Close"
        title="Close (Esc)"
        onClick={() => void navigate({ to: '/knowledge' })}
      >
        <Icon name="close" size={20} />
      </button>
    </header>
  )
}
