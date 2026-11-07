import { GroupCard } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { groupsOf, keyOf, shareOf } from '../rules'
import { useTags } from '../TagsProvider'
import './TagsList.css'

export function TagsList() {
  const { LL } = useI18nContext()
  const { shown, selected, select } = useTags()
  const max = Math.max(1, ...shown.map((t) => t.total))
  return (
    <GroupCard label={LL.tags.title()} className="tg-list">
      {shown.map((tag) => {
        const key = keyOf(tag)
        const g = groupsOf(tag.byType)
        return (
          <button
            key={key}
            type="button"
            className="tg-row"
            aria-pressed={selected !== undefined && keyOf(selected) === key}
            onClick={() => select(key)}
          >
            <span className="tg-name">{tag.name}</span>
            <span className="tg-field">
              {tag.field === 'tags' ? LL.tags.tag() : LL.tags.label()}
            </span>
            <span
              className="tg-usage"
              title={LL.tags.usage({
                goals: g.goals,
                projects: g.projects,
                tasks: g.tasks,
                docs: g.docs,
              })}
            >
              <span className="tg-usage-bar" aria-hidden="true">
                <span style={{ width: `${shareOf(tag.total, max) * 100}%` }} />
              </span>
              <strong className="tg-total">{tag.total}</strong>
            </span>
            <span className="tg-often">
              {tag.often.slice(0, 3).map((o) => (
                <span key={`${o.field}:${o.name}`} className="tg-chip">
                  {o.name}
                </span>
              ))}
            </span>
            <span className="tg-cluster">{tag.cluster}</span>
          </button>
        )
      })}
      {shown.length === 0 && <div className="kn-nomatch">{LL.tags.noMatch()}</div>}
    </GroupCard>
  )
}
