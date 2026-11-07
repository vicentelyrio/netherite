import type { Board } from '@netherite/api'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FilterTabs } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { knowledgeQuery } from '@/infrastructure/query'
import { ProjectEmpty } from '../ProjectEmpty'
import { KnowledgeViewRow } from './KnowledgeViewRow'
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
        className="pkv-filter"
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
                <KnowledgeViewRow key={row.id} row={row} project={board.id} />
              ))}
            </tbody>
          )
        })}
      </table>
    </div>
  )
}
