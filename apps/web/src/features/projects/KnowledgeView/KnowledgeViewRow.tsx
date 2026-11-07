import type { KnowledgeRow } from '@netherite/api'
import { type AdrStatus, AdrStatusPill, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { FreshnessCell } from '@/components'
import { ago } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'

export function KnowledgeViewRow({
  row,
  project,
}: {
  readonly row: KnowledgeRow
  readonly project: string
}) {
  const { LL } = useI18nContext()
  const others = row.projects.filter((p) => p !== project)
  const explained = Object.entries(row.explains).map(([type, count]) =>
    LL.common.typeCount[type as ItemTypeName]({ count }),
  )
  const linkedTo = [
    ...(explained.length === 0 ? [] : [LL.projects.explains({ what: explained.join(', ') })]),
    ...others,
  ]
  return (
    <tr className="pkv-row">
      <td>
        <TypeBadge type={row.type as ItemTypeName} />
      </td>
      <td className="pkv-title">
        <Link to="/items/$id" params={{ id: row.id }} className="pkv-id">
          {row.id}
        </Link>
        <span
          data-superseded={row.status === 'superseded' || row.status === 'deprecated' || undefined}
        >
          {row.title}
        </span>
      </td>
      <td>
        {row.status !== undefined && row.status !== 'active' ? (
          <AdrStatusPill status={row.status as AdrStatus} />
        ) : (
          <span className="app-muted">—</span>
        )}
      </td>
      <td className="app-muted">{linkedTo.length === 0 ? '—' : linkedTo.join(' · ')}</td>
      <td className="app-muted">{ago(row.date)}</td>
      <td>
        <FreshnessCell freshness={row.freshness} commits={row.commits} />
      </td>
    </tr>
  )
}
