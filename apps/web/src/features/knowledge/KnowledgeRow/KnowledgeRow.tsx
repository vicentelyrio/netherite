import type { KnowledgeRow as Row } from '@netherite/api'
import {
  type AdrStatus,
  AdrStatusPill,
  Avatar,
  type ItemTypeName,
  OrphanTag,
  TypeBadge,
} from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { FreshnessCell } from '@/components'
import { ago } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import '../shared.css'
import './KnowledgeRow.css'

/** One file in the index: type, title and path, status, project, age and freshness. */
export function KnowledgeRow({
  row,
  selected,
  onSelect,
}: {
  readonly row: Row
  readonly selected: boolean
  readonly onSelect: () => void
}) {
  // A retired item of any type is struck through, as a superseded ADR is.
  const { LL } = useI18nContext()
  const superseded = row.status === 'superseded' || row.status === 'deprecated'
  return (
    // biome-ignore lint/a11y/useSemanticElements: the row holds links, so it cannot be a button
    <div
      className="kn-row"
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      data-selected={selected || undefined}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
    >
      <TypeBadge type={row.type as ItemTypeName} />
      <div className="kn-title-cell">
        <div className="kn-title-line">
          <Link
            to="/items/$id"
            params={{ id: row.id }}
            className="kn-id"
            onClick={(e) => e.stopPropagation()}
          >
            {row.id}
          </Link>
          <span className="kn-title" data-superseded={superseded || undefined}>
            {row.title}
          </span>
          {row.aiTokens !== null && (
            <span className="kn-ai" title={LL.knowledge.row.aiContextHint()}>
              {LL.knowledge.row.aiContext({ tokens: row.aiTokens })}
            </span>
          )}
          {row.orphan && <OrphanTag />}
        </div>
        <span className="kn-mono">{row.path}</span>
      </div>
      <div>
        {row.status !== undefined && row.status !== 'active' ? (
          <AdrStatusPill status={row.status as AdrStatus} />
        ) : (
          <span className="app-muted">—</span>
        )}
      </div>
      <span className="kn-project">
        {row.projects[0] !== undefined && <span className="kn-project-dot" />}
        {row.projects[0] ?? '—'}
      </span>
      <span className="kn-modified">
        {row.handle !== undefined && <Avatar name={row.handle} size={20} />}
        {ago(row.date)}
      </span>
      <FreshnessCell freshness={row.freshness} commits={row.commits} />
    </div>
  )
}
