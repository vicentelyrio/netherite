import type { KnowledgeRow } from '@netherite/api'
import {
  type AdrStatus,
  AdrStatusPill,
  Banner,
  Button,
  Card,
  Chip,
  EmptyState,
  FreshnessLabel,
  type ItemTypeName,
  OrphanTag,
  SegmentedControl,
  TypeBadge,
} from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { useApi } from '../lib/app-context'
import { useNotices } from '../lib/notices'
import { knowledgeQuery, previewQuery } from '../lib/queries'
import { useWrite } from '../lib/writes'

export type SortKey = 'id' | 'title' | 'freshness' | 'date'

export interface Filters {
  readonly type: string
  readonly status: string
  readonly project: string
  readonly tag: string
  readonly stale: boolean
  readonly orphans: boolean
  readonly sort: SortKey
}

export const noFilters: Filters = {
  type: 'all',
  status: '',
  project: '',
  tag: '',
  stale: false,
  orphans: false,
  sort: 'id',
}

const freshnessRank = { stale: 0, drifting: 1, unknown: 2, fresh: 3 } as const

/** What the index shows: the filters apply together, and the type tab is not part of the counts. */
export const filterKnowledge = (rows: ReadonlyArray<KnowledgeRow>, f: Filters): KnowledgeRow[] =>
  rows
    .filter(
      (r) =>
        (f.type === 'all' || r.type === f.type) &&
        (f.status === '' || r.status === f.status) &&
        (f.project === '' || r.projects.includes(f.project)) &&
        (f.tag === '' || r.tags.includes(f.tag)) &&
        (!f.stale || r.freshness === 'stale' || r.freshness === 'drifting') &&
        (!f.orphans || r.orphan),
    )
    .sort((a, b) => {
      switch (f.sort) {
        case 'title':
          return a.title.localeCompare(b.title) || a.id.localeCompare(b.id)
        case 'freshness': {
          const ra = a.freshness === null ? 4 : freshnessRank[a.freshness]
          const rb = b.freshness === null ? 4 : freshnessRank[b.freshness]
          return ra - rb || a.id.localeCompare(b.id)
        }
        case 'date':
          // Newest first; items with no date last.
          return (b.date ?? '').localeCompare(a.date ?? '') || a.id.localeCompare(b.id)
        default:
          return a.id.localeCompare(b.id)
      }
    })

/** Counts per type tab, over everything the other filters let through. */
export const typeCounts = (rows: ReadonlyArray<KnowledgeRow>, f: Filters) => {
  const base = filterKnowledge(rows, { ...f, type: 'all' })
  const counts: Record<string, number> = { all: base.length }
  for (const r of base) counts[r.type] = (counts[r.type] ?? 0) + 1
  return counts
}

const typeTabs = [
  ['all', 'All'],
  ['adr', 'ADRs'],
  ['doc', 'Docs'],
  ['context', 'Context'],
  ['runbook', 'Runbooks'],
] as const

const adrStatuses = ['proposed', 'accepted', 'deprecated', 'superseded']

const importPrompt =
  'Import the Markdown files under docs/ into Netherite. For each file, create a doc with the Netherite MCP `create_item` tool (type doc), keep its text, and set `covers` to the code it describes. Create them in order and lint when done.'

function Preview({ row }: { readonly row: KnowledgeRow }) {
  const api = useApi()
  const query = useQuery(previewQuery(api, row.id))
  return (
    <aside className="kn-preview" aria-label={`Preview of ${row.id}`}>
      <div className="app-row">
        <TypeBadge type={row.type as ItemTypeName} />
        <code className="app-id">{row.id}</code>
      </div>
      <h2 className="kn-preview-title">{row.title}</h2>
      {query.isPending && <p className="app-muted">Loading…</p>}
      {query.isError && <p className="app-muted">Could not load the preview.</p>}
      {query.data && (
        <>
          <p>{query.data.summary || <span className="app-muted">No summary.</span>}</p>
          <h3 className="nt-overline">Linked from</h3>
          <ul className="app-link-list">
            {query.data.backlinks.map((b) => (
              <li key={`${b.kind}:${b.path}`}>
                <span className="app-muted">{b.kind.replace('_', ' ')}</span>{' '}
                {b.id ? (
                  <Link to="/items/$id" params={{ id: b.id }}>
                    {b.id} {b.title}
                  </Link>
                ) : (
                  <code>{b.path}</code>
                )}
              </li>
            ))}
            {query.data.backlinks.length === 0 && <li className="app-muted">Nothing links here</li>}
          </ul>
          <h3 className="nt-overline">Changes with</h3>
          {query.data.coChanged === null ? (
            <p className="app-muted">Needs git history.</p>
          ) : (
            <ul className="app-link-list">
              {query.data.coChanged.files.map((f) => (
                <li key={f.path}>
                  <code>{f.path}</code>{' '}
                  <span className="app-muted">
                    {f.commits} of {query.data.coChanged?.itemCommits} commits
                  </span>
                </li>
              ))}
              {query.data.coChanged.files.length === 0 && (
                <li className="app-muted">No files change with it yet</li>
              )}
            </ul>
          )}
          <Link to="/items/$id" params={{ id: row.id }}>
            Open
          </Link>
        </>
      )}
    </aside>
  )
}

function Row({
  row,
  selected,
  onSelect,
}: {
  readonly row: KnowledgeRow
  readonly selected: boolean
  readonly onSelect: () => void
}) {
  return (
    <Card selected={selected} onClick={onSelect}>
      <div className="app-row">
        <TypeBadge type={row.type as ItemTypeName} />
        <Link to="/items/$id" params={{ id: row.id }} onClick={(e) => e.stopPropagation()}>
          <code className="app-id">{row.id}</code>
        </Link>
        <span className="app-row-title">{row.title}</span>
        {row.type === 'adr' && row.status !== undefined && (
          <AdrStatusPill status={row.status as AdrStatus} />
        )}
        {row.freshness !== null && row.freshness !== 'unknown' && (
          <FreshnessLabel state={row.freshness} />
        )}
        {row.orphan && <OrphanTag />}
      </div>
    </Card>
  )
}

function Starters() {
  const api = useApi()
  const notices = useNotices()
  const [adding, setAdding] = useState<'doc' | 'adr' | undefined>()
  const create = useWrite(api, (a, v: { type: 'doc' | 'adr'; title: string }) =>
    a.call((c) => c.items.create({ payload: v })),
  )
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const title = new FormData(e.currentTarget).get('title')
    if (adding === undefined || typeof title !== 'string' || title.trim() === '') return
    create.mutate({ type: adding, title: title.trim() }, { onSuccess: () => setAdding(undefined) })
  }
  const copy = () => {
    void navigator.clipboard?.writeText(importPrompt).then(() =>
      notices.notify({
        variant: 'success',
        title: 'Prompt copied',
        text: 'Paste it to an agent connected to Netherite to import the files under docs/.',
      }),
    )
  }
  return (
    <EmptyState
      icon="menu_book"
      title="No knowledge yet"
      description="Docs, ADRs and context you add show up here, with what they cover and who links to them."
      actions={
        adding === undefined ? (
          <>
            <Button variant="primary" icon="add" onClick={() => setAdding('doc')}>
              New doc
            </Button>
            <Button icon="gavel" onClick={() => setAdding('adr')}>
              New ADR
            </Button>
            <Button icon="upload_file" onClick={copy}>
              Import from docs/
            </Button>
          </>
        ) : (
          <form className="goal-title-form" onSubmit={submit}>
            <input
              name="title"
              className="goal-title-input"
              aria-label={adding === 'doc' ? 'Doc title' : 'ADR title'}
              placeholder={adding === 'doc' ? 'Doc title' : 'ADR title'}
              // biome-ignore lint/a11y/noAutofocus: the form appears because the person asked for it
              autoFocus
              onKeyDown={(e) => e.key === 'Escape' && setAdding(undefined)}
            />
            <Button variant="primary" type="submit">
              Create
            </Button>
          </form>
        )
      }
    />
  )
}

export function KnowledgePage() {
  const api = useApi()
  const query = useQuery(knowledgeQuery(api))
  const [filters, setFilters] = useState<Filters>(noFilters)
  const [selected, setSelected] = useState<string | undefined>()

  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    return (
      <div className="app-page">
        <Banner variant="danger" title="Could not load knowledge">
          Check that `netherite serve` is still running.
        </Banner>
      </div>
    )
  }
  const rows = query.data.items
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch })
  const counts = typeCounts(rows, filters)
  const shown = filterKnowledge(rows, filters)
  const projects = [...new Set(rows.flatMap((r) => r.projects))].sort()
  const tags = [...new Set(rows.flatMap((r) => r.tags))].sort()
  const current = shown.find((r) => r.id === selected)

  return (
    <div className="app-page app-page--wide">
      <h1 className="app-title">Knowledge</h1>
      {rows.length === 0 ? (
        <Starters />
      ) : (
        <>
          <SegmentedControl
            aria-label="Type"
            value={filters.type}
            onChange={(type) => set({ type })}
            data={typeTabs.map(([value, label]) => ({
              value,
              label: `${label} ${counts[value] ?? 0}`,
            }))}
          />
          <div className="kn-filters">
            <select
              aria-label="Status"
              value={filters.status}
              onChange={(e) => set({ status: e.currentTarget.value })}
            >
              <option value="">Any status</option>
              {adrStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              aria-label="Project"
              value={filters.project}
              onChange={(e) => set({ project: e.currentTarget.value })}
            >
              <option value="">Any project</option>
              {projects.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select
              aria-label="Tag"
              value={filters.tag}
              onChange={(e) => set({ tag: e.currentTarget.value })}
            >
              <option value="">Any tag</option>
              {tags.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <Chip checked={filters.stale} onChange={(stale) => set({ stale })}>
              Stale
            </Chip>
            <Chip checked={filters.orphans} onChange={(orphans) => set({ orphans })}>
              Orphans
            </Chip>
            <select
              aria-label="Sort"
              value={filters.sort}
              onChange={(e) => set({ sort: e.currentTarget.value as SortKey })}
            >
              <option value="id">Sort: ID</option>
              <option value="title">Sort: Title</option>
              <option value="freshness">Sort: Stalest first</option>
              <option value="date">Sort: Newest</option>
            </select>
          </div>
          <div className={current ? 'kn-layout kn-layout--preview' : 'kn-layout'}>
            <section className="app-list" aria-label="Knowledge">
              {shown.map((row) => (
                <Row
                  key={row.id}
                  row={row}
                  selected={row.id === selected}
                  onSelect={() => setSelected(row.id)}
                />
              ))}
              {shown.length === 0 && (
                <EmptyState
                  icon="filter_alt_off"
                  title="Nothing matches"
                  description="No knowledge matches these filters."
                  actions={<Button onClick={() => setFilters(noFilters)}>Clear filters</Button>}
                />
              )}
            </section>
            {current && <Preview row={current} />}
          </div>
        </>
      )}
    </div>
  )
}
