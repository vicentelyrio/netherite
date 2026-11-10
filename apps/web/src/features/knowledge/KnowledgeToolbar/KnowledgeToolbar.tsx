import { Icon } from '@netherite/ui'
import { useRef } from 'react'
import { FilterTabs, SearchField, SelectField } from '@/components'
import { adrStatusLabel, useI18nContext } from '@/infrastructure/i18n'
import { useActionShortcuts } from '@/infrastructure/shortcuts'
import type { SortKey } from '../filters'
import { useKnowledgeIndex } from '../KnowledgeProvider'
import './KnowledgeToolbar.css'

const typeTabs = ['all', 'adr', 'doc', 'context', 'runbook'] as const

const adrStatuses = ['proposed', 'accepted', 'deprecated', 'superseded']

const sorts: ReadonlyArray<SortKey> = ['date', 'id', 'title', 'freshness']

export function KnowledgeToolbar() {
  const { LL } = useI18nContext()
  const { rows, filters, set, counts } = useKnowledgeIndex()
  const filter = useRef<HTMLInputElement>(null)
  useActionShortcuts({ 'knowledge.filter': () => filter.current?.focus() })
  if (rows.length === 0) return null
  const projects = [...new Set(rows.flatMap((r) => r.projects))].sort()
  const tags = [...new Set(rows.flatMap((r) => r.tags))].sort()
  const staleCount = rows.filter(
    (r) => r.freshness === 'stale' || r.freshness === 'drifting',
  ).length
  const orphanCount = rows.filter((r) => r.orphan).length
  return (
    <div className="kn-bar">
      <SearchField
        inputRef={filter}
        label={LL.knowledge.toolbar.filter()}
        value={filters.q}
        onChange={(q) => set({ q })}
      />
      <FilterTabs
        label={LL.knowledge.toolbar.type()}
        options={typeTabs.map((value) => ({
          value,
          label: LL.knowledge.toolbar.tabs[value](),
          count: counts[value] ?? 0,
        }))}
        value={filters.type}
        onChange={(type) => set({ type })}
      />
      <SelectField
        label={LL.knowledge.toolbar.status()}
        value={filters.status}
        options={adrStatuses}
        labelOf={(status) => adrStatusLabel(LL, status)}
        onChange={(status) => set({ status })}
      />
      <SelectField
        label={LL.knowledge.toolbar.project()}
        value={filters.project}
        options={projects}
        onChange={(project) => set({ project })}
      />
      <SelectField
        label={LL.knowledge.toolbar.tag()}
        value={filters.tag}
        options={tags}
        onChange={(tag) => set({ tag })}
      />
      <div className="kn-extra">
        <button
          type="button"
          className="kn-pill kn-pill--stale"
          aria-pressed={filters.stale}
          onClick={() => set({ stale: !filters.stale })}
        >
          <Icon name="warning" size={15} filled /> {LL.knowledge.toolbar.stale()}{' '}
          <span>{staleCount}</span>
        </button>
        <button
          type="button"
          className="kn-pill"
          aria-pressed={filters.orphans}
          onClick={() => set({ orphans: !filters.orphans })}
        >
          <Icon name="link_off" size={15} /> {LL.knowledge.toolbar.orphans()}{' '}
          <span>{orphanCount}</span>
        </button>
        <span className="kn-spacer" />
        <label className="kn-sort">
          {LL.knowledge.toolbar.sort()}
          <select
            aria-label={LL.knowledge.toolbar.sort()}
            value={filters.sort}
            onChange={(e) => set({ sort: e.currentTarget.value as SortKey })}
          >
            {sorts.map((value) => (
              <option key={value} value={value}>
                {LL.knowledge.toolbar.sorts[value]()}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
