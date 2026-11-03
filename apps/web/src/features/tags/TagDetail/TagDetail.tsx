import { Button } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { SelectField } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { useWrite } from '@/infrastructure/query'
import { RenameForm } from '../RenameForm'
import { grepFor, groupsOf, keyOf, recentIds } from '../rules'
import { useTags } from '../TagsProvider'
import './TagDetail.css'

const usedKinds = [
  { key: 'goals', color: '#8f91f2' },
  { key: 'projects', color: '#3ba474' },
  { key: 'tasks', color: '#d9a646' },
  { key: 'docs', color: '#8fc3f2' },
] as const

/** The tag picked on the map or in the list: where it is used, what it goes with, and what to do with it. */
export function TagDetail() {
  const { LL } = useI18nContext()
  const api = useApi()
  const notices = useNotices()
  const { all, selected, select } = useTags()
  const [renaming, setRenaming] = useState(false)
  const [into, setInto] = useState('')
  const merge = useWrite(api, (a, input: { field: 'tags' | 'labels'; from: string; to: string }) =>
    a.call((c) => c.tags.rename({ payload: input })),
  )
  if (selected === undefined) {
    return (
      <section className="td td-empty" aria-label={LL.tags.detail.title()}>
        <p className="app-muted">{LL.tags.detail.pick()}</p>
      </section>
    )
  }
  const g = groupsOf(selected.byType)
  const others = all.filter((t) => t.field === selected.field && t.name !== selected.name)
  return (
    <section className="td" aria-label={LL.tags.detail.title()}>
      <header className="td-head">
        <h2 className="td-name">{selected.name}</h2>
        <span className="td-meta">
          {selected.field === 'tags' ? LL.tags.tag() : LL.tags.label()} · {selected.cluster}
        </span>
      </header>

      <h3 className="td-h">{LL.tags.detail.usedIn()}</h3>
      <div className="td-bar" aria-hidden="true">
        {usedKinds.map((k) =>
          g[k.key] === 0 ? null : (
            <span
              key={k.key}
              style={{
                width: `${(g[k.key] / Math.max(1, selected.total)) * 100}%`,
                background: k.color,
              }}
            />
          ),
        )}
      </div>
      <ul className="td-used">
        <li style={{ opacity: g.goals ? 1 : 0.45 }}>
          <i style={{ background: usedKinds[0]?.color }} />
          {LL.tags.detail.goals({ count: g.goals })}
        </li>
        <li style={{ opacity: g.projects ? 1 : 0.45 }}>
          <i style={{ background: usedKinds[1]?.color }} />
          {LL.tags.detail.projects({ count: g.projects })}
        </li>
        <li style={{ opacity: g.tasks ? 1 : 0.45 }}>
          <i style={{ background: usedKinds[2]?.color }} />
          {LL.tags.detail.tasks({ count: g.tasks })}
        </li>
        <li style={{ opacity: g.docs ? 1 : 0.45 }}>
          <i style={{ background: usedKinds[3]?.color }} />
          {LL.tags.detail.docs({ count: g.docs })}
        </li>
      </ul>

      {selected.often.length > 0 && (
        <>
          <h3 className="td-h">{LL.tags.detail.often()}</h3>
          <div className="td-chips">
            {selected.often.map((o) => (
              <button
                key={keyOf(o)}
                type="button"
                className="td-chip"
                onClick={() => select(keyOf(o))}
              >
                <span className="td-chip-name">{o.name}</span>
                <span className="td-chip-bar" aria-hidden="true">
                  <span
                    style={{
                      width: `${(o.count / Math.max(1, ...selected.often.map((x) => x.count))) * 100}%`,
                    }}
                  />
                </span>
                <span className="td-chip-n">{LL.tags.detail.shared({ count: o.count })}</span>
              </button>
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

      <div className="td-actions">
        <Button size="sm" icon="edit" onClick={() => setRenaming(!renaming)}>
          {LL.tags.rename()}
        </Button>
      </div>
      {renaming && <RenameForm tag={selected} tags={all} onDone={() => setRenaming(false)} />}
      {others.length > 0 && (
        <div className="td-merge">
          <SelectField
            label={LL.tags.detail.mergeInto()}
            value={into}
            options={others.map((t) => t.name)}
            onChange={setInto}
            anyLabel={LL.tags.detail.choose()}
          />
          <Button
            size="sm"
            disabled={into === ''}
            loading={merge.isPending}
            onClick={() =>
              merge.mutate(
                { field: selected.field, from: selected.name, to: into },
                {
                  onSuccess: (r) => {
                    notices.notify({
                      variant: 'success',
                      title: LL.tags.renamed({ name: into }),
                      text: LL.tags.changedIn({ count: r.renamed }),
                    })
                    setInto('')
                    select(`${selected.field}:${into}`)
                  },
                },
              )
            }
          >
            {LL.tags.merge()}
          </Button>
        </div>
      )}
    </section>
  )
}
