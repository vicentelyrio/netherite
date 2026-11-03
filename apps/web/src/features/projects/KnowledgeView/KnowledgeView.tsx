import type { Board, KnowledgeRow } from '@netherite/api'
import { type AdrStatus, AdrStatusPill, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FreshnessCell } from '@/components'
import { useApi } from '@/infrastructure/api'
import { ago } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { knowledgeQuery } from '@/infrastructure/query'
import './KnowledgeView.css'

const groups = ['adr', 'context', 'doc', 'runbook'] as const

/** Everything in knowledge linked to the project, by type, with status, links, age and freshness. */
export function KnowledgeView({ board }: { readonly board: Board }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(knowledgeQuery(api))
  if (!query.data) return null
  const mine = query.data.items.filter((r) => r.projects.includes(board.id))
  if (mine.length === 0) return <p className="app-muted">{LL.projects.noKnowledge()}</p>
  return (
    <table className="pkv" aria-label={LL.projects.knowledgeTable.label()}>
      <thead>
        <tr>
          {(['type', 'title', 'status', 'linkedTo', 'modified', 'freshness'] as const).map((c) => (
            <th key={c} scope="col" data-col={c}>
              {LL.projects.knowledgeTable[c]()}
            </th>
          ))}
        </tr>
      </thead>
      {groups.map((type) => {
        const rows = mine.filter((r) => r.type === type)
        if (rows.length === 0) return null
        return (
          <tbody key={type}>
            <tr className="pkv-head">
              <th scope="colgroup" colSpan={6}>
                {LL.projects.knowledgeTable.groups[type]()} <span>{rows.length}</span>
              </th>
            </tr>
            {rows.map((row) => (
              <Row key={row.id} row={row} project={board.id} />
            ))}
          </tbody>
        )
      })}
    </table>
  )
}

function Row({ row, project }: { readonly row: KnowledgeRow; readonly project: string }) {
  const others = row.projects.filter((p) => p !== project)
  return (
    <tr className="pkv-row">
      <td>
        <TypeBadge type={row.type as ItemTypeName} />
      </td>
      <td className="pkv-title">
        <Link to="/items/$id" params={{ id: row.id }} className="pkv-id">
          {row.id}
        </Link>
        <span data-superseded={row.status === 'superseded' || undefined}>{row.title}</span>
      </td>
      <td>
        {row.type === 'adr' && row.status !== undefined ? (
          <AdrStatusPill status={row.status as AdrStatus} />
        ) : (
          <span className="app-muted">—</span>
        )}
      </td>
      <td className="app-muted">{others.length === 0 ? '—' : others.join(', ')}</td>
      <td className="app-muted">{ago(row.date)}</td>
      <td>
        <FreshnessCell freshness={row.freshness} commits={row.commits} />
      </td>
    </tr>
  )
}
