import type { KnowledgeRow } from '@netherite/api'
import {
  type AdrStatus,
  AdrStatusPill,
  Banner,
  Button,
  Icon,
  type ItemTypeName,
  Menu,
  OrphanTag,
  TypeBadge,
} from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Breadcrumbs, GroupCard, TitleForm } from '@/components'
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
  /** Text to find in the title, ID or path. */
  readonly q: string
}

export const noFilters: Filters = {
  type: 'all',
  status: '',
  project: '',
  tag: '',
  stale: false,
  orphans: false,
  sort: 'date',
  q: '',
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
        (!f.orphans || r.orphan) &&
        (f.q.trim() === '' ||
          `${r.id} ${r.title} ${r.path}`.toLowerCase().includes(f.q.trim().toLowerCase())),
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
  ['adr', 'ADR'],
  ['doc', 'Doc'],
  ['context', 'Context'],
  ['runbook', 'Runbook'],
] as const

const groupNames: ReadonlyArray<readonly [string, string]> = [
  ['adr', 'Decisions'],
  ['doc', 'Docs'],
  ['context', 'AI context'],
  ['runbook', 'Runbooks'],
]

const adrStatuses = ['proposed', 'accepted', 'deprecated', 'superseded']

const sorts: ReadonlyArray<readonly [SortKey, string]> = [
  ['date', 'Last modified'],
  ['id', 'ID'],
  ['title', 'Title'],
  ['freshness', 'Stalest first'],
]

const importPrompt =
  'Import the Markdown files under docs/ into Netherite. For each file, create a doc with the Netherite MCP `create_item` tool (type doc), keep its text, and set `covers` to the code it describes. Create them in order and lint when done.'

const starters: ReadonlyArray<{ type: ItemTypeName; text: string; path: string }> = [
  {
    type: 'adr',
    text: 'Record a decision with context, the choice and its consequences.',
    path: 'adr/0001-….md',
  },
  {
    type: 'doc',
    text: 'Technical docs and guides that explain how things work.',
    path: 'docs/….md',
  },
  {
    type: 'context',
    text: 'Curated context for AI agents, synced to CLAUDE.md or MCP.',
    path: 'context/….md',
  },
  { type: 'runbook', text: 'Step-by-step operational procedures.', path: 'runbooks/….md' },
]

/** How long ago a date was, in the design's short form: `2d ago`, `7w ago`, `4mo ago`. */
export const ago = (date: string | undefined, now = Date.now()): string => {
  if (date === undefined) return '—'
  const then = Date.parse(date)
  if (Number.isNaN(then)) return '—'
  const days = Math.max(0, Math.floor((now - then) / 86_400_000))
  if (days < 1) return 'today'
  if (days < 14) return `${days}d ago`
  if (days < 60) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function FreshnessCell({ row }: { readonly row: KnowledgeRow }) {
  if (row.freshness === null) return <span className="kn-fresh kn-fresh--na">Not tracked</span>
  if (row.freshness === 'stale') {
    return (
      <span className="kn-fresh kn-fresh--stale">
        <Icon name="warning" size={15} filled /> Stale · {row.commits} commits
      </span>
    )
  }
  if (row.freshness === 'drifting') {
    return (
      <span className="kn-fresh kn-fresh--drift">
        <span className="kn-dot kn-dot--ring" /> {row.commits} commits behind
      </span>
    )
  }
  if (row.freshness === 'fresh') {
    return (
      <span className="kn-fresh">
        <span className="kn-dot" /> Fresh
      </span>
    )
  }
  return <span className="kn-fresh kn-fresh--na">Not tracked</span>
}

function Preview({ row }: { readonly row: KnowledgeRow }) {
  const api = useApi()
  const query = useQuery(previewQuery(api, row.id))
  const data = query.data
  return (
    <aside className="kn-preview" aria-label={`Preview of ${row.id}`}>
      <div className="kn-preview-top">
        <TypeBadge type={row.type as ItemTypeName} />
        <Link to="/items/$id" params={{ id: row.id }} className="kn-open" aria-label="Open">
          Open <Icon name="arrow_forward" size={16} />
        </Link>
      </div>
      <div>
        <h2 className="kn-preview-title">
          {row.id} · {row.title}
        </h2>
        <div className="kn-mono">{row.path}</div>
      </div>
      {row.freshness === 'stale' && (
        <div className="kn-warning">
          <Icon name="warning" size={18} filled />
          <div>
            <strong>Code changed in {row.commits} commits since this doc was updated</strong>
            <span>Last reviewed {row.date ?? 'never'}</span>
          </div>
        </div>
      )}
      {query.isPending && <p className="app-muted">Loading…</p>}
      {query.isError && <p className="app-muted">Could not load the preview.</p>}
      {data && (
        <>
          <p className="kn-summary">{data.summary || 'No summary.'}</p>
          <section>
            <h3 className="kn-h">Backlinks · {data.backlinks.length}</h3>
            {data.backlinks.map((b) => (
              <div key={`${b.kind}:${b.path}`} className="kn-link-row">
                <span className="kn-link-dot" />
                {b.id ? (
                  <Link to="/items/$id" params={{ id: b.id }}>
                    {b.id} {b.title}
                  </Link>
                ) : (
                  <code>{b.path}</code>
                )}
                <span className="app-muted">{b.kind.replace('_', ' ')}</span>
              </div>
            ))}
            {data.backlinks.length === 0 && (
              <div className="kn-none">
                <Icon name="link_off" size={15} /> Nothing links here yet
              </div>
            )}
          </section>
          <section>
            <h3 className="kn-h">Co-changed files</h3>
            {data.coChanged === null ? (
              <p className="app-muted">Needs git history.</p>
            ) : (
              data.coChanged.files.map((f) => (
                <div key={f.path} className="kn-file-row">
                  <span className="kn-mono">{f.path}</span>
                  <span className="kn-bar-mini">
                    <span style={{ width: `${Math.round(f.share * 100)}%` }} />
                  </span>
                  <span className="app-muted">{f.commits}</span>
                </div>
              ))
            )}
            {data.coChanged?.files.length === 0 && (
              <p className="app-muted">No files change with it yet</p>
            )}
          </section>
        </>
      )}
      <footer className="kn-preview-foot">Updated {row.date ?? '—'}</footer>
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
  const superseded = row.status === 'superseded'
  return (
    // biome-ignore lint/a11y/useSemanticElements: the row holds links, so it cannot be a button
    <div
      className="kn-row"
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      data-selected={selected || undefined}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
    >
      <TypeBadge type={row.type as ItemTypeName} />
      <div className="kn-title-cell">
        <div className="kn-title-line">
          <Link
            to="/items/$id"
            params={{ id: row.id }}
            className="kn-id"
            onClick={(e) => e.stopPropagation()}
          >
            {row.id}
          </Link>
          <span className="kn-title" data-superseded={superseded || undefined}>
            {row.title}
          </span>
          {row.orphan && <OrphanTag />}
        </div>
        <span className="kn-mono">{row.path}</span>
      </div>
      <div>
        {row.type === 'adr' && row.status !== undefined ? (
          <AdrStatusPill status={row.status as AdrStatus} />
        ) : (
          <span className="app-muted">—</span>
        )}
      </div>
      <span className="kn-project">
        {row.projects[0] !== undefined && <span className="kn-project-dot" />}
        {row.projects[0] ?? '—'}
      </span>
      <span className="kn-modified">{ago(row.date)}</span>
      <FreshnessCell row={row} />
    </div>
  )
}

function Starters({
  onStart,
}: {
  readonly onStart: (type: 'doc' | 'adr' | 'context' | 'runbook') => void
}) {
  const notices = useNotices()
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
    <div className="kn-empty">
      <div className="kn-empty-icon">
        <Icon name="stacks" size={32} />
      </div>
      <div className="kn-empty-text">
        <h2>No knowledge in this repo yet</h2>
        <p>
          Docs, decisions and agent context are Markdown files with typed frontmatter in{' '}
          <code>knowledge/</code>. They link to your goals, projects and tasks like everything else.
        </p>
      </div>
      <div className="kn-empty-actions">
        <Button variant="primary" icon="add" onClick={() => onStart('adr')}>
          Record first decision
        </Button>
        <Button icon="drive_file_move" onClick={copy}>
          Import from docs/
        </Button>
      </div>
      <div className="kn-starters">
        {starters.map((s) => (
          // biome-ignore lint/a11y/useSemanticElements: a card with a badge and text, not a plain button
          <div
            key={s.type}
            className="kn-starter"
            role="button"
            tabIndex={0}
            onClick={() => onStart(s.type as 'doc' | 'adr' | 'context' | 'runbook')}
            onKeyDown={(e) =>
              e.key === 'Enter' && onStart(s.type as 'doc' | 'adr' | 'context' | 'runbook')
            }
          >
            <TypeBadge type={s.type} />
            <span>{s.text}</span>
            <span className="kn-mono">{s.path}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function KnowledgePage() {
  const api = useApi()
  const query = useQuery(knowledgeQuery(api))
  const [filters, setFilters] = useState<Filters>(noFilters)
  const [selected, setSelected] = useState<string | undefined>()
  const [creating, setCreating] = useState<'doc' | 'adr' | 'context' | 'runbook' | undefined>()
  const create = useWrite(
    api,
    (a, v: { type: 'doc' | 'adr' | 'context' | 'runbook'; title: string }) =>
      a.call((c) => c.items.create({ payload: v })),
  )

  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    return (
      <div className="app-page app-page--wide">
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
  const staleCount = rows.filter(
    (r) => r.freshness === 'stale' || r.freshness === 'drifting',
  ).length
  const orphanCount = rows.filter((r) => r.orphan).length
  const current = shown.find((r) => r.id === selected) ?? shown[0]

  return (
    <div className="app-page app-page--wide kn-page">
      <header className="kn-head">
        <div>
          <Breadcrumbs icon="stacks">
            <strong>Knowledge</strong>
          </Breadcrumbs>
          <h1 className="app-title kn-h1">Knowledge</h1>
          <p className="kn-sub">
            Docs, decisions and agent context ·{' '}
            {rows.length === 0 ? 'nothing in knowledge/ yet' : `${rows.length} files in knowledge/`}
          </p>
        </div>
        <div className="kn-head-actions">
          <Link to="/decisions" className="kn-link-button">
            <Icon name="timeline" size={16} /> Decision log
          </Link>
          <Menu>
            <Menu.Target>
              <Button variant="primary" icon="add">
                New
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {(
                [
                  ['doc', 'New doc'],
                  ['adr', 'New ADR'],
                  ['context', 'New context'],
                  ['runbook', 'New runbook'],
                ] as const
              ).map(([type, label]) => (
                <Menu.Item key={type} onClick={() => setCreating(type)}>
                  {label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </div>
      </header>
      {creating !== undefined && (
        <TitleForm
          label={`New ${creating} title`}
          onCancel={() => setCreating(undefined)}
          onSubmit={(title) =>
            create.mutate({ type: creating, title }, { onSuccess: () => setCreating(undefined) })
          }
        />
      )}

      {rows.length === 0 ? (
        <Starters onStart={setCreating} />
      ) : (
        <>
          <div className="kn-bar">
            <label className="kn-search">
              <Icon name="search" size={18} />
              <input
                aria-label="Filter by title or path"
                placeholder="Filter by title or path"
                value={filters.q}
                onChange={(e) => set({ q: e.currentTarget.value })}
              />
            </label>
            <div className="kn-tabs" role="radiogroup" aria-label="Type">
              {typeTabs.map(([value, label]) => (
                <label key={value} data-on={filters.type === value || undefined}>
                  <input
                    type="radio"
                    name="kn-type"
                    className="nt-visually-hidden"
                    checked={filters.type === value}
                    onChange={() => set({ type: value })}
                  />
                  {label} <span className="kn-count">{counts[value] ?? 0}</span>
                </label>
              ))}
            </div>
            <label className="kn-select">
              <span>Status</span>
              <select
                aria-label="Status"
                value={filters.status}
                onChange={(e) => set({ status: e.currentTarget.value })}
              >
                <option value="">Any</option>
                {adrStatuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="kn-select">
              <span>Project</span>
              <select
                aria-label="Project"
                value={filters.project}
                onChange={(e) => set({ project: e.currentTarget.value })}
              >
                <option value="">Any</option>
                {projects.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="kn-select">
              <span>Tag</span>
              <select
                aria-label="Tag"
                value={filters.tag}
                onChange={(e) => set({ tag: e.currentTarget.value })}
              >
                <option value="">Any</option>
                {tags.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
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
          <div className="kn-layout">
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
                      <Row
                        key={row.id}
                        row={row}
                        selected={row.id === current?.id}
                        onSelect={() => setSelected(row.id)}
                      />
                    ))}
                  </GroupCard>
                )
              })}
              {shown.length === 0 && (
                <div className="kn-nomatch">
                  No docs match these filters.{' '}
                  <button type="button" onClick={() => setFilters(noFilters)}>
                    Clear filters
                  </button>
                </div>
              )}
            </section>
            {current && <Preview row={current} />}
          </div>
        </>
      )}
    </div>
  )
}
