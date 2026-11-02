import type { KnowledgeRow } from '@netherite/api'
import { Unavailable } from '@netherite/api'
import { Avatar, Banner, EmptyState, Icon } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useApi } from '../lib/app-context'
import { decisionsQuery, knowledgeQuery } from '../lib/queries'

export interface Transition {
  readonly id: string
  readonly field: string
  readonly from?: unknown
  readonly to?: unknown
  readonly kind: string
  readonly hash: string
  readonly date: string
  readonly author: { readonly name: string }
}

export interface Change {
  readonly id: string
  readonly title: string
  readonly from: string | undefined
  readonly to: string
  /** The ADR that replaced this one, when this change is its supersession. */
  readonly note: string | undefined
  /** This change follows another in the same commit that is the one replacing it. */
  readonly link: boolean
}

export interface CommitCard {
  readonly hash: string
  readonly date: string
  readonly author: string
  readonly changes: ReadonlyArray<Change>
}

export interface Lane {
  readonly project: string
  readonly adrs: number
  readonly chains: number
  /** Newest first. */
  readonly commits: ReadonlyArray<CommitCard>
}

const noProject = 'No project'

/**
 * One lane per project: every status change of its ADRs, grouped by the commit that made it,
 * newest first. An ADR in two projects shows in both lanes; one in none is in "No project", last.
 */
export const lanesOf = (
  rows: ReadonlyArray<KnowledgeRow>,
  transitions: ReadonlyArray<Transition>,
  only = '',
): Lane[] => {
  const adrs = rows.filter((r) => r.type === 'adr')
  const byId = new Map(adrs.map((r) => [r.id, r]))
  const lanes = new Map<string, KnowledgeRow[]>()
  for (const adr of adrs) {
    for (const project of adr.projects.length === 0 ? [noProject] : adr.projects) {
      lanes.set(project, [...(lanes.get(project) ?? []), adr])
    }
  }
  return [...lanes]
    .filter(([project]) => only === '' || project === only)
    .sort(([a], [b]) => (a === noProject ? 1 : b === noProject ? -1 : a.localeCompare(b)))
    .map(([project, list]) => {
      const ids = new Set(list.map((a) => a.id))
      const mine = transitions.filter(
        (t) => t.field === 'status' && t.kind !== 'seen' && ids.has(t.id),
      )
      const commits = new Map<string, Transition[]>()
      for (const t of mine) commits.set(t.hash, [...(commits.get(t.hash) ?? []), t])
      const cards: CommitCard[] = [...commits.values()]
        .map((group) => {
          const ids = new Set(group.map((t) => t.id))
          const first = group[0] as Transition
          const changes = [...group]
            .sort((a, b) => {
              // The ADR that replaces another comes first, so "supersedes" reads downward.
              const rank = (t: Transition) => (t.to === 'superseded' ? 1 : 0)
              return rank(a) - rank(b) || a.id.localeCompare(b.id)
            })
            .map((t): Change => {
              const row = byId.get(t.id)
              const by = row?.supersededBy[0]
              return {
                id: t.id,
                title: row?.title ?? t.id,
                from: typeof t.from === 'string' ? t.from : undefined,
                to: typeof t.to === 'string' ? t.to : '',
                note: t.to === 'superseded' && by !== undefined ? `by ${by}` : undefined,
                link: t.to === 'superseded' && by !== undefined && ids.has(by),
              }
            })
          return { hash: first.hash, date: first.date, author: first.author.name, changes }
        })
        .sort((a, b) => b.date.localeCompare(a.date))
      const chains = list.filter((a) => a.supersedes.length > 0).length
      return { project, adrs: list.length, chains, commits: cards }
    })
}

const statusStyle: Record<string, { label: string; color: string; icon: string }> = {
  proposed: { label: 'Proposed', color: '#a5a7ff', icon: 'pending' },
  accepted: { label: 'Accepted', color: '#2cc27e', icon: 'check_circle' },
  deprecated: { label: 'Deprecated', color: '#f0717e', icon: 'block' },
  superseded: { label: 'Superseded', color: '#969ab8', icon: 'swap_horiz' },
}

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

function Chip({ status, faded }: { readonly status: string; readonly faded?: boolean }) {
  const s = statusStyle[status] ?? { label: status, color: '#b9bcd3', icon: 'circle' }
  return (
    <span
      className="dl-chip"
      data-status={status}
      style={{ ['--dl' as string]: s.color, opacity: faded ? 0.7 : 1 }}
    >
      <Icon name={s.icon} size={13} /> {s.label}
    </span>
  )
}

function Card({ commit }: { readonly commit: CommitCard }) {
  const top = commit.changes.find((c) => c.to !== 'superseded') ?? commit.changes[0]
  const color = statusStyle[top?.to ?? '']?.color ?? '#b9bcd3'
  const chain = commit.changes.some((c) => c.link)
  return (
    <div className="dl-commit">
      <div className="dl-date">
        <strong>{day(commit.date)}</strong>
        <span>{new Date(commit.date).getFullYear()}</span>
      </div>
      <div className="dl-node-col">
        <span
          className="dl-node"
          style={{ borderColor: color, background: chain ? '#282a3f' : color }}
        />
      </div>
      <div className="dl-card" data-chain={chain || undefined}>
        <div className="dl-card-head">
          <Avatar name={commit.author} size={18} />
          <span>{commit.author}</span>
          <span className="kn-spacer" />
          <code>{commit.hash.slice(0, 7)}</code>
        </div>
        {commit.changes.map((c) => (
          <div key={`${c.id}:${c.to}`} className="dl-change">
            {c.link && (
              <div className="dl-supersedes">
                <span />
                <Icon name="south" size={14} /> supersedes
              </div>
            )}
            <div className="dl-change-title" data-old={c.to === 'superseded' || undefined}>
              <span className="kf-diamond" data-hollow={c.to === 'superseded' || undefined} />
              <Link to="/items/$id" params={{ id: c.id }} className="kf-chain-id">
                {c.id}
              </Link>
              <strong>{c.title}</strong>
            </div>
            <div className="dl-change-chips">
              {c.from !== undefined && (
                <>
                  <Chip status={c.from} faded />
                  <Icon name="arrow_forward" size={14} />
                </>
              )}
              <Chip status={c.to} />
              {c.note && <span className="app-muted">{c.note}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DecisionsPage() {
  const api = useApi()
  const knowledge = useQuery(knowledgeQuery(api))
  const decisions = useQuery(decisionsQuery(api))
  const [project, setProject] = useState('')

  if (knowledge.isPending || decisions.isPending) {
    return <div className="app-page app-muted">Loading…</div>
  }
  if (knowledge.isError) {
    return (
      <div className="app-page app-page--wide">
        <Banner variant="danger" title="Could not load decisions">
          Check that `netherite serve` is still running.
        </Banner>
      </div>
    )
  }
  const noGit = decisions.isError && decisions.error instanceof Unavailable
  const transitions = decisions.data?.transitions ?? []
  const all = lanesOf(knowledge.data.items, transitions)
  const lanes = lanesOf(knowledge.data.items, transitions, project)

  return (
    <div className="app-page app-page--wide dl-page">
      <header className="dl-head">
        <div>
          <nav className="goal-crumbs" aria-label="Breadcrumb">
            <Icon name="stacks" />
            <Link to="/knowledge">Knowledge</Link>
            <span> / </span>
            <strong>Decision log</strong>
          </nav>
          <h1 className="app-title dl-title">Decision log</h1>
          <p className="kn-sub">
            Status changes from <code className="dl-code">git log -- knowledge/adr</code> · newest
            first
          </p>
        </div>
        <div className="dl-legend">
          {Object.entries(statusStyle).map(([key, s]) => (
            <span key={key}>
              <span
                className="dl-legend-dot"
                style={{ borderColor: s.color, background: s.color }}
              />
              {s.label}
            </span>
          ))}
          <span>
            <span
              className="dl-legend-dot"
              style={{ borderColor: '#969ab8', background: '#282a3f' }}
            />
            Supersession
          </span>
          <span className="kn-rule" />
          <div className="kn-tabs" role="radiogroup" aria-label="Project">
            {[['', 'All projects'], ...all.map((l) => [l.project, l.project])].map(
              ([value, label]) => (
                <label key={value} data-on={project === value || undefined}>
                  <input
                    type="radio"
                    name="dl-project"
                    className="nt-visually-hidden"
                    checked={project === value}
                    onChange={() => setProject(value as string)}
                  />
                  {label}
                </label>
              ),
            )}
          </div>
        </div>
      </header>
      {noGit && (
        <Banner variant="info" title="No git history">
          Status changes come from git, so there is no timeline here.
        </Banner>
      )}
      {decisions.data?.partial && (
        <Banner variant="warning" title="History is cut short">
          This is a shallow clone, so older status changes are missing.
        </Banner>
      )}
      {lanes.length === 0 ? (
        <EmptyState
          icon="gavel"
          title="No decisions yet"
          description="ADRs you record show up here, in a lane per project."
        />
      ) : (
        <div
          className="dl-lanes"
          style={{ ['--lanes' as string]: lanes.length === 1 ? 2 : lanes.length }}
        >
          {lanes.map((lane) => (
            <section key={lane.project} className="dl-lane" aria-label={lane.project}>
              <h2 className="dl-lane-head">
                <span className="dl-lane-dot" />
                {lane.project}
                <span className="app-muted">
                  {lane.adrs} ADRs
                  {lane.chains > 0 ? ` · ${lane.chains} chain${lane.chains === 1 ? '' : 's'}` : ''}
                </span>
              </h2>
              <div className="dl-timeline">
                {lane.commits.map((commit) => (
                  <Card key={commit.hash} commit={commit} />
                ))}
                {lane.commits.length === 0 && <p className="app-muted">No recorded changes</p>}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
