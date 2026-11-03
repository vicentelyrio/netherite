import { Icon } from '@netherite/ui'
import { FilterTabs, SearchField, SelectField } from '@/components'
import type { SortKey } from '../filters'
import { useKnowledgeIndex } from '../KnowledgeProvider'
import './KnowledgeToolbar.css'

const typeTabs = [
  ['all', 'All'],
  ['adr', 'ADR'],
  ['doc', 'Doc'],
  ['context', 'Context'],
  ['runbook', 'Runbook'],
] as const

const adrStatuses = ['proposed', 'accepted', 'deprecated', 'superseded']

const sorts: ReadonlyArray<readonly [SortKey, string]> = [
  ['date', 'Last modified'],
  ['id', 'ID'],
  ['title', 'Title'],
  ['freshness', 'Stalest first'],
]

/** Search, type tabs, drop-down filters, the stale and orphan toggles, and the sort. */
export function KnowledgeToolbar() {
  const { rows, filters, set, counts } = useKnowledgeIndex()
  if (rows.length === 0) return null
  const projects = [...new Set(rows.flatMap((r) => r.projects))].sort()
  const tags = [...new Set(rows.flatMap((r) => r.tags))].sort()
  const staleCount = rows.filter(
    (r) => r.freshness === 'stale' || r.freshness === 'drifting',
  ).length
  const orphanCount = rows.filter((r) => r.orphan).length
  return (
    <div className="kn-bar">
      <SearchField label="Filter by title or path" value={filters.q} onChange={(q) => set({ q })} />
      <FilterTabs
        label="Type"
        options={typeTabs.map(([value, label]) => ({ value, label, count: counts[value] ?? 0 }))}
        value={filters.type}
        onChange={(type) => set({ type })}
      />
      <SelectField
        label="Status"
        value={filters.status}
        options={adrStatuses}
        onChange={(status) => set({ status })}
      />
      <SelectField
        label="Project"
        value={filters.project}
        options={projects}
        onChange={(project) => set({ project })}
      />
      <SelectField
        label="Tag"
        value={filters.tag}
        options={tags}
        onChange={(tag) => set({ tag })}
      />
      <span className="kn-rule" />
      <button
        type="button"
        className="kn-pill kn-pill--stale"
        aria-pressed={filters.stale}
        onClick={() => set({ stale: !filters.stale })}
      >
        <Icon name="warning" size={15} filled /> Stale <span>{staleCount}</span>
      </button>
      <button
        type="button"
        className="kn-pill"
        aria-pressed={filters.orphans}
        onClick={() => set({ orphans: !filters.orphans })}
      >
        <Icon name="link_off" size={15} /> Orphans <span>{orphanCount}</span>
      </button>
      <span className="kn-spacer" />
      <label className="kn-sort">
        Sort
        <select
          aria-label="Sort"
          value={filters.sort}
          onChange={(e) => set({ sort: e.currentTarget.value as SortKey })}
        >
          {sorts.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
