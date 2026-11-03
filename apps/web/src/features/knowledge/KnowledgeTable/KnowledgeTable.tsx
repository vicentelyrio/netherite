import { GroupCard } from '@/components'
import { useKnowledgeIndex } from '../KnowledgeProvider'
import { KnowledgeRow } from '../KnowledgeRow'
import '../shared.css'
import { useI18nContext } from '@/infrastructure/i18n'
import './KnowledgeTable.css'

const groupNames = ['adr', 'doc', 'context', 'runbook'] as const

/** The files that pass the filters, grouped by type under a row of column names. */
export function KnowledgeTable() {
  const { LL } = useI18nContext()
  const { shown, current, select, clear } = useKnowledgeIndex()
  return (
    <section aria-label={LL.knowledge.table.label()}>
      <div className="kn-cols">
        <span>{LL.knowledge.table.type()}</span>
        <span>{LL.knowledge.table.title()}</span>
        <span>{LL.knowledge.table.status()}</span>
        <span>{LL.knowledge.table.project()}</span>
        <span>{LL.knowledge.table.modified()}</span>
        <span>{LL.knowledge.table.freshness()}</span>
      </div>
      {groupNames.map((type) => {
        const inGroup = shown.filter((r) => r.type === type)
        if (inGroup.length === 0) return null
        return (
          <GroupCard key={type} title={LL.knowledge.table.groups[type]()} count={inGroup.length}>
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
          {LL.knowledge.table.noMatch()}{' '}
          <button type="button" onClick={clear}>
            {LL.knowledge.table.clear()}
          </button>
        </div>
      )}
    </section>
  )
}
