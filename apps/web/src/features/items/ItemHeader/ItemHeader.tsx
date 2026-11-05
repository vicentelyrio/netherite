import type { ItemDetail } from '@netherite/api'
import {
  type AdrStatus,
  AdrStatusPill,
  Button,
  FreshnessLabel,
  type ItemTypeName,
  OrphanTag,
  TypeBadge,
} from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import './ItemHeader.css'

const reviewable = new Set(['doc', 'runbook', 'context'])

/** What kind of item this is, its ID, state and freshness, and how to edit or review it. */
export function ItemHeader({
  item,
  editing,
  onToggleEditing,
  reviewing,
  onReview,
}: {
  readonly item: ItemDetail
  readonly editing: boolean
  readonly onToggleEditing: () => void
  readonly reviewing: boolean
  readonly onReview: () => void
}) {
  const { LL } = useI18nContext()
  const type = item.type as ItemTypeName
  const fresh = item.freshness
  return (
    <header className="app-item-head">
      <div className="app-item-meta">
        <TypeBadge type={type} />
        <code className="app-id">{item.id}</code>
        {type === 'adr' && item.status !== undefined && (
          <AdrStatusPill status={item.status as AdrStatus} />
        )}
        {type === 'task' && item.state !== undefined && (
          <span className="app-muted">{item.state}</span>
        )}
        {fresh !== null && fresh.state !== 'unknown' && (
          <FreshnessLabel
            state={fresh.state}
            commits={fresh.commits}
            atLeast={fresh.atLeast}
            {...(fresh.since === null ? {} : { since: fresh.since })}
          />
        )}
        {item.orphan && <OrphanTag />}
      </div>
      <Button icon={editing ? 'visibility' : 'edit'} onClick={onToggleEditing}>
        {editing ? LL.items.doneEditing() : LL.items.editSource()}
      </Button>
      {reviewable.has(type) && !(fresh?.state === 'stale' || fresh?.state === 'drifting') && (
        <Button icon="done_all" loading={reviewing} onClick={onReview}>
          {LL.items.markReviewed()}
        </Button>
      )}
    </header>
  )
}
