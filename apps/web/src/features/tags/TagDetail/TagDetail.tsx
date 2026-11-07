import { Button } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import { DuplicatesBanner } from '../DuplicatesBanner'
import { RenameForm } from '../RenameForm'
import { grepFor, groupsOf, keyOf, recentIds } from '../rules'
import { useTags } from '../TagsProvider'
import { TagChip } from './TagChip'
import { TagHeading } from './TagHeading'
import { TagMerge } from './TagMerge'
import { TagOverview } from './TagOverview'
import { TagUsage } from './TagUsage'
import './TagDetail.css'

export function TagDetail() {
  const { LL } = useI18nContext()
  const { all, selected, select, duplicates } = useTags()
  const [merging, setMerging] = useState(false)
  const [renaming, setRenaming] = useState(false)
  if (selected === undefined) return <TagOverview />
  const pair = duplicates.find(
    (d) => keyOf(d.a) === keyOf(selected) || keyOf(d.b) === keyOf(selected),
  )
  const others = all.filter((t) => t.field === selected.field && t.name !== selected.name)
  const oftenPeak = Math.max(1, ...selected.often.map((x) => x.count))
  return (
    <section className="td" aria-label={LL.tags.detail.title()}>
      <TagHeading
        title={selected.name}
        meta={
          <>
            {LL.tags.detail.count({ count: selected.total })} ·{' '}
            {selected.field === 'tags' ? LL.tags.tag() : LL.tags.label()} · {selected.cluster}
          </>
        }
      >
        <div className="td-actions">
          <Button size="sm" onClick={() => setRenaming(!renaming)}>
            {LL.tags.rename()}
          </Button>
          {others.length > 0 && (
            <Button size="sm" onClick={() => setMerging(!merging)}>
              {LL.tags.detail.mergeMore()}
            </Button>
          )}
        </div>
      </TagHeading>
      {renaming && <RenameForm tag={selected} tags={all} onDone={() => setRenaming(false)} />}
      {pair !== undefined && <DuplicatesBanner pair={pair} />}

      <TagUsage groups={groupsOf(selected.byType)} total={selected.total} />

      {selected.often.length > 0 && (
        <>
          <h3 className="td-h">{LL.tags.detail.often()}</h3>
          <div className="td-chips">
            {selected.often.map((o) => (
              <TagChip
                key={keyOf(o)}
                name={o.name}
                share={o.count / oftenPeak}
                note={LL.tags.detail.shared({ count: o.count })}
                onClick={() => select(keyOf(o))}
              />
            ))}
          </div>
        </>
      )}

      <h3 className="td-h">{LL.tags.detail.recent()}</h3>
      <ul className="td-recent" aria-label={LL.tags.items({ name: selected.name })}>
        {recentIds(selected.ids).map((id) => (
          <li key={id}>
            <Link to="/items/$id" params={{ id }}>
              {id}
            </Link>
          </li>
        ))}
      </ul>

      <h3 className="td-h">{LL.tags.detail.grep()}</h3>
      <code className="td-grep">{grepFor(selected)}</code>

      {merging && others.length > 0 && <TagMerge tag={selected} others={others} />}
    </section>
  )
}
