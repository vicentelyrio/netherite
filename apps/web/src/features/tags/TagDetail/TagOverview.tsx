import { useI18nContext } from '@/infrastructure/i18n'
import { keyOf } from '../rules'
import { useTags } from '../TagsProvider'
import { TagChip } from './TagChip'
import { overviewSize } from './TagDetail.constants'
import { TagHeading } from './TagHeading'

export function TagOverview() {
  const { LL } = useI18nContext()
  const { all, select } = useTags()
  const top = [...all]
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, overviewSize)
  const peak = Math.max(1, ...top.map((t) => t.total))
  const clusters = [
    ...all.reduce(
      (m, t) => m.set(t.cluster, (m.get(t.cluster) ?? 0) + 1),
      new Map<string, number>(),
    ),
  ]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, overviewSize)
  const tagged = new Set(all.flatMap((t) => t.ids)).size
  return (
    <section className="td" aria-label={LL.tags.detail.title()}>
      <TagHeading
        title={LL.tags.overview.title()}
        meta={LL.tags.overview.summary({
          tags: all.filter((t) => t.field === 'tags').length,
          labels: all.filter((t) => t.field === 'labels').length,
          items: tagged,
        })}
      />
      <h3 className="td-h">{LL.tags.overview.mostUsed()}</h3>
      <div className="td-chips">
        {top.map((t) => (
          <TagChip
            key={keyOf(t)}
            name={t.name}
            share={t.total / peak}
            note={LL.tags.detail.count({ count: t.total })}
            onClick={() => select(keyOf(t))}
          />
        ))}
      </div>
      <h3 className="td-h">{LL.tags.overview.clusters()}</h3>
      <ul className="td-clusters">
        {clusters.map(([name, count]) => (
          <li key={name}>
            <span>{name}</span>
            <span className="app-muted">{count}</span>
          </li>
        ))}
      </ul>
      <p className="td-hint">{LL.tags.detail.pick()}</p>
    </section>
  )
}
