import type { ItemDetail } from '@netherite/api'
import { Button, Icon, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { formatDate, now } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import type { ReviewAction } from '../DocMain'
import './DocHeader.css'

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
  const { LL } = useI18nContext()
  const navigate = useNavigate()
  const type = item.type as ItemTypeName
  const folder = item.path.split('/').slice(-2, -1)[0] ?? ''
  const file = item.path.split('/').at(-1) ?? item.id
  const reviewedAt = (item.frontmatter as { reviewed_at?: unknown }).reviewed_at
  const reviewed = typeof reviewedAt === 'string' ? reviewedAt : undefined
  return (
    <header className="kf-head">
      <Icon name="stacks" size={16} />
      <nav className="kf-path" aria-label={LL.knowledge.doc.header.path()}>
        <Link to="/knowledge">{LL.knowledge.doc.header.knowledge()}</Link> ›{' '}
        <Link to="/knowledge" search={{ q: `/${folder}/` }}>
          {folder}
        </Link>{' '}
        › <strong title={file}>{file}</strong>
      </nav>
      <TypeBadge type={type} />
      {changedLines > 0 && (
        <span className="kf-lines">
          {LL.knowledge.doc.header.changedLines({ count: changedLines })}
        </span>
      )}
      <code className="app-id kf-id">{item.id}</code>
      <span className="kf-spacer" />
      {!stale && (type === 'doc' || type === 'runbook' || type === 'context') && (
        <Button
          size="sm"
          icon="done_all"
          title={LL.knowledge.doc.header.reviewHint()}
          loading={review.pending}
          disabled={reviewed === now().format('YYYY-MM-DD')}
          onClick={review.run}
        >
          {reviewed === undefined
            ? LL.knowledge.doc.header.markReviewed()
            : LL.knowledge.doc.header.reviewedAt({ date: formatDate(reviewed) })}
        </Button>
      )}
      <button
        type="button"
        className="kf-close"
        aria-label={LL.knowledge.doc.header.close()}
        title={LL.knowledge.doc.header.closeTitle()}
        onClick={() => void navigate({ to: '/knowledge' })}
      >
        <Icon name="close" size={20} />
      </button>
    </header>
  )
}
