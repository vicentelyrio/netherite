import { GroupCard } from '@/components'
import { useKnowledgeIndex } from '../KnowledgeProvider'
import { KnowledgeRow } from '../KnowledgeRow'
import '../shared.css'
import './KnowledgeTable.css'

const groupNames: ReadonlyArray<readonly [string, string]> = [
  ['adr', 'Decisions'],
  ['doc', 'Docs'],
  ['context', 'AI context'],
  ['runbook', 'Runbooks'],
]

/** The files that pass the filters, grouped by type under a row of column names. */
export function KnowledgeTable() {
  const { shown, current, select, clear } = useKnowledgeIndex()
  return (
    <section aria-label="Knowledge">
      <div className="kn-cols">
        <span>Type</span>
        <span>Title</span>
        <span>Status</span>
        <span>Project</span>
        <span>Modified</span>
        <span>Freshness</span>
      </div>
      {groupNames.map(([type, name]) => {
        const inGroup = shown.filter((r) => r.type === type)
        if (inGroup.length === 0) return null
        return (
          <GroupCard key={type} title={name} count={inGroup.length}>
            {inGroup.map((row) => (
              <KnowledgeRow
                key={row.id}
                row={row}
                selected={row.id === current?.id}
                onSelect={() => select(row.id)}
              />
            ))}
          </GroupCard>
        )
      })}
      {shown.length === 0 && (
        <div className="kn-nomatch">
          No docs match these filters.{' '}
          <button type="button" onClick={clear}>
            Clear filters
          </button>
        </div>
      )}
    </section>
  )
}
