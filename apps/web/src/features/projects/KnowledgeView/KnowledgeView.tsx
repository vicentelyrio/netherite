import type { Board, KnowledgeRow } from '@netherite/api'
import {
  type AdrStatus,
  AdrStatusPill,
  type ItemTypeName,
  TypeBadge,
  typeLabels,
} from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { FilterTabs, FreshnessCell } from '@/components'
import { useApi } from '@/infrastructure/api'
import { ago } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { knowledgeQuery } from '@/infrastructure/query'
import { ProjectEmpty } from '../ProjectEmpty'
import './KnowledgeView.css'

const groups = ['adr', 'context', 'doc', 'runbook'] as const

export function KnowledgeView({ board }: { readonly board: Board }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const query = useQuery(knowledgeQuery(api))
  const [only, setOnly] = useState<'all' | (typeof groups)[number]>('all')
  if (!query.data) return null
  const mine = query.data.items.filter((r) => r.projects.includes(board.id))
  if (mine.length === 0) return <ProjectEmpty board={board} />
  return (
    <div className="pkv-wrap">
      <FilterTabs
        label={LL.projects.knowledgeTable.filter()}
        options={[
          { value: 'all' as const, label: LL.projects.knowledgeTable.all(), count: mine.length },
          ...groups
            .filter((g) => mine.some((r) => r.type === g))
            .map((g) => ({
              value: g,
              label: LL.projects.knowledgeTable.groups[g](),
              count: mine.filter((r) => r.type === g).length,
            })),
        ]}
        value={only}
        onChange={setOnly}
      />
      <table className="pkv" aria-label={LL.projects.knowledgeTable.label()}>
        <thead>
          <tr>
            {(['type', 'title', 'status', 'linkedTo', 'modified', 'freshness'] as const).map(
              (c) => (
                <th key={c} scope="col" data-col={c}>
                  {LL.projects.knowledgeTable[c]()}
                </th>
              ),
            )}
          </tr>
        </thead>
        {groups.map((type) => {
          const rows = mine.filter((r) => r.type === type)
          if (rows.length === 0 || (only !== 'all' && only !== type)) return null
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
    </div>
  )
}

function Row({ row, project }: { readonly row: KnowledgeRow; readonly project: string }) {
  const { LL } = useI18nContext()
  const others = row.projects.filter((p) => p !== project)
  const explained = Object.entries(row.explains).map(
    ([type, count]) =>
      `${count} ${typeLabels[type as ItemTypeName].toLowerCase()}${count === 1 ? '' : 's'}`,
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
