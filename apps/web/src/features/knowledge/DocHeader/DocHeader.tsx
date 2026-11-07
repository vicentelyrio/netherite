import type { ItemDetail } from '@netherite/api'
import { Button, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { formatDate, now } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { DocBar, DocBarSpacer } from '../DocBar'
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
    <DocBar
      path={
        <>
          <Link to="/knowledge">{LL.knowledge.doc.header.knowledge()}</Link> ›{' '}
          <Link to="/knowledge" search={{ q: `/${folder}/` }}>
            {folder}
          </Link>{' '}
          › <strong title={file}>{file}</strong>
        </>
      }
      onClose={() => void navigate({ to: '/knowledge' })}
    >
      <TypeBadge type={type} />
      {changedLines > 0 && (
        <span className="kf-lines">
          {LL.knowledge.doc.header.changedLines({ count: changedLines })}
        </span>
      )}
      <code className="app-id kf-id">{item.id}</code>
      <DocBarSpacer />
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
    </DocBar>
  )
}
