import type { TagUse } from '@netherite/api'
import { Banner, Button, EmptyState, Icon, type ItemTypeName, TypeGlyph } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { Breadcrumbs, FilterTabs, GroupCard, SearchField } from '@/components'
import { useApi } from '../lib/app-context'
import { useNotices } from '../lib/notices'
import { tagsQuery } from '../lib/queries'
import { useWrite } from '../lib/writes'

export type FieldFilter = 'all' | 'tags' | 'labels'

/** What the page shows: the field tabs and the text filter apply together; the order is the server's. */
export const filterTags = (tags: ReadonlyArray<TagUse>, field: FieldFilter, q: string): TagUse[] =>
  tags.filter(
    (t) =>
      (field === 'all' || t.field === field) &&
      (q.trim() === '' || t.name.toLowerCase().includes(q.trim().toLowerCase())),
  )

/** What a new name does to a tag: nothing, an error, or a merge into one that exists. */
export const renameOutcome = (
  tags: ReadonlyArray<TagUse>,
  tag: TagUse,
  next: string,
): 'same' | 'empty' | 'spaces' | 'merge' | 'rename' => {
  const to = next.trim()
  if (to === '') return 'empty'
  if (/\s/.test(to)) return 'spaces'
  if (to === tag.name) return 'same'
  return tags.some((t) => t.field === tag.field && t.name === to) ? 'merge' : 'rename'
}

const messages = {
  empty: 'A tag needs a name',
  spaces: 'A tag cannot contain spaces',
  same: '',
  merge: 'That name is in use: the two will merge',
  rename: '',
} as const

function RenameForm({
  tag,
  tags,
  onDone,
}: {
  readonly tag: TagUse
  readonly tags: ReadonlyArray<TagUse>
  readonly onDone: () => void
}) {
  const api = useApi()
  const notices = useNotices()
  const [name, setName] = useState(tag.name)
  const rename = useWrite(api, (a, to: string) =>
    a.call((c) => c.tags.rename({ payload: { field: tag.field, from: tag.name, to } })),
  )
  const outcome = renameOutcome(tags, tag, name)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (outcome === 'same' || outcome === 'empty' || outcome === 'spaces') return
    rename.mutate(name.trim(), {
      onSuccess: (r) => {
        notices.notify({
          variant: 'success',
          title: `Renamed to ${name.trim()}`,
          text: `Changed in ${r.renamed} ${r.renamed === 1 ? 'file' : 'files'}.`,
        })
        onDone()
      },
    })
  }
  return (
    <form className="tg-rename" onSubmit={submit} aria-label={`Rename ${tag.name}`}>
      <input
        className="goal-title-input"
        aria-label={`New name for ${tag.name}`}
        value={name}
        // biome-ignore lint/a11y/noAutofocus: the form appears because the person asked for it
        autoFocus
        onChange={(e) => setName(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Escape' && onDone()}
      />
      <Button
        variant="primary"
        type="submit"
        disabled={outcome === 'same' || outcome === 'empty' || outcome === 'spaces'}
        loading={rename.isPending}
      >
        {outcome === 'merge' ? 'Merge' : 'Rename'}
      </Button>
      {messages[outcome] && <span className="app-muted">{messages[outcome]}</span>}
    </form>
  )
}

function Row({ tag, tags }: { readonly tag: TagUse; readonly tags: ReadonlyArray<TagUse> }) {
  const [open, setOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  return (
    <div className="tg-row-wrap">
      <div className="tg-row">
        <button
          type="button"
          className="tg-name"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? 'expand_more' : 'chevron_right'} size={16} />
          <span className="goal-tag">{tag.name}</span>
        </button>
        <span className="tg-field">{tag.field === 'tags' ? 'tag' : 'label'}</span>
        <span className="tg-types">
          {Object.entries(tag.byType)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([type, n]) => (
              <span key={type} className="tg-type" title={`${n} ${type}`}>
                <TypeGlyph type={type as ItemTypeName} /> {n}
              </span>
            ))}
        </span>
        <strong className="tg-total">{tag.total}</strong>
        <Button size="sm" icon="edit" onClick={() => setRenaming(!renaming)}>
          Rename
        </Button>
      </div>
      {renaming && <RenameForm tag={tag} tags={tags} onDone={() => setRenaming(false)} />}
      {open && (
        <ul className="tg-items" aria-label={`Items with ${tag.name}`}>
          {tag.ids.map((id) => (
            <li key={id}>
              <Link to="/items/$id" params={{ id }}>
                {id}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Tags: every tag and label in the workspace with how many items of each type carry it, and a way
 * to rename one everywhere at once (through the same core operations as any other edit).
 */
export function TagsPage() {
  const api = useApi()
  const query = useQuery(tagsQuery(api))
  const [field, setField] = useState<FieldFilter>('all')
  const [q, setQ] = useState('')

  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    return (
      <div className="app-page app-page--wide">
        <Banner variant="danger" title="Could not load tags">
          Check that `netherite serve` is still running.
        </Banner>
      </div>
    )
  }
  const all = query.data.tags
  const shown = filterTags(all, field, q)
  const count = (f: FieldFilter) =>
    f === 'all' ? all.length : all.filter((t) => t.field === f).length

  return (
    <div className="app-page app-page--wide tg-page">
      <Breadcrumbs icon="sell">
        <strong>Tags</strong>
      </Breadcrumbs>
      <h1 className="app-title">Tags</h1>
      {all.length === 0 ? (
        <EmptyState
          icon="sell"
          title="No tags yet"
          description="Add `tags` to any item, or `labels` to a task or project, and they are counted here."
        />
      ) : (
        <>
          <div className="kn-bar">
            <SearchField label="Filter tags" value={q} onChange={setQ} />
            <FilterTabs
              label="Kind"
              options={(
                [
                  ['all', 'All'],
                  ['tags', 'Tags'],
                  ['labels', 'Labels'],
                ] as const
              ).map(([value, label]) => ({ value, label, count: count(value) }))}
              value={field}
              onChange={setField}
            />
          </div>
          <GroupCard label="Tags" className="tg-list">
            {shown.map((tag) => (
              <Row key={`${tag.field}:${tag.name}`} tag={tag} tags={all} />
            ))}
            {shown.length === 0 && <div className="kn-nomatch">No tags match.</div>}
          </GroupCard>
        </>
      )}
    </div>
  )
}
