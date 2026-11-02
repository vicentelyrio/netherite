import type { KnowledgeRow } from '@netherite/api'
import { Unavailable } from '@netherite/api'
import { type AdrStatus, AdrStatusPill, Banner, Card, EmptyState } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useApi } from '../lib/app-context'
import { decisionsQuery, knowledgeQuery } from '../lib/queries'

interface Step {
  readonly from: string
  readonly to: string
  readonly date: string
  readonly author: string
}

export interface Lane {
  readonly project: string
  readonly adrs: ReadonlyArray<KnowledgeRow>
}

const noProject = 'No project'

/**
 * One lane per project, each holding the ADRs linked to it. An ADR linked to two projects is in
 * both lanes; one linked to none is in "No project", last. With `only`, just that project's lane.
 */
export const lanesOf = (rows: ReadonlyArray<KnowledgeRow>, only = ''): Lane[] => {
  const adrs = rows.filter((r) => r.type === 'adr')
  const lanes = new Map<string, KnowledgeRow[]>()
  for (const adr of adrs) {
    for (const project of adr.projects.length === 0 ? [noProject] : adr.projects) {
      lanes.set(project, [...(lanes.get(project) ?? []), adr])
    }
  }
  return [...lanes]
    .filter(([project]) => only === '' || project === only)
    .sort(([a], [b]) => (a === noProject ? 1 : b === noProject ? -1 : a.localeCompare(b)))
    .map(([project, list]) => ({
      project,
      adrs: list.sort(
        (a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.id.localeCompare(b.id),
      ),
    }))
}

/** The status changes of each ADR, oldest first. Only changes to `status` count. */
export const stepsById = (
  transitions: ReadonlyArray<{
    id: string
    field: string
    from?: unknown
    to?: unknown
    kind: string
    date: string
    author: { name: string }
  }>,
): Map<string, Step[]> => {
  const steps = new Map<string, Step[]>()
  for (const t of transitions) {
    if (t.field !== 'status' || t.kind === 'seen') continue
    const list = steps.get(t.id) ?? []
    list.push({
      from: typeof t.from === 'string' ? t.from : '',
      to: typeof t.to === 'string' ? t.to : '',
      date: t.date.slice(0, 10),
      author: t.author.name,
    })
    steps.set(t.id, list)
  }
  for (const list of steps.values()) list.sort((a, b) => a.date.localeCompare(b.date))
  return steps
}

function DecisionCard({
  adr,
  steps,
}: {
  readonly adr: KnowledgeRow
  readonly steps: ReadonlyArray<Step>
}) {
  return (
    <Card>
      <div className="goal-card">
        <div className="app-row">
          <Link to="/items/$id" params={{ id: adr.id }}>
            <code className="app-id">{adr.id}</code>
          </Link>
          {adr.status !== undefined && <AdrStatusPill status={adr.status as AdrStatus} />}
        </div>
        <div className="goal-card-title">{adr.title}</div>
        {adr.supersedes.length > 0 && (
          <div className="app-muted">
            Supersedes{' '}
            {adr.supersedes.map((id) => (
              <Link key={id} to="/items/$id" params={{ id }}>
                {id}{' '}
              </Link>
            ))}
          </div>
        )}
        {adr.supersededBy.length > 0 && (
          <div className="app-muted">
            Superseded by{' '}
            {adr.supersededBy.map((id) => (
              <Link key={id} to="/items/$id" params={{ id }}>
                {id}{' '}
              </Link>
            ))}
          </div>
        )}
        <ol className="dec-steps" aria-label={`${adr.id} status changes`}>
          {steps.map((s) => (
            <li key={`${s.date}:${s.to}`}>
              {s.from === '' ? `Proposed as ${s.to}` : `${s.from} → ${s.to}`}{' '}
              <span className="app-muted">
                {s.date}, {s.author}
              </span>
            </li>
          ))}
          {steps.length === 0 && <li className="app-muted">No recorded changes</li>}
        </ol>
      </div>
    </Card>
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
      <div className="app-page">
        <Banner variant="danger" title="Could not load decisions">
          Check that `netherite serve` is still running.
        </Banner>
      </div>
    )
  }
  const noGit = decisions.isError && decisions.error instanceof Unavailable
  const steps = decisions.data ? stepsById(decisions.data.transitions) : new Map<string, Step[]>()
  const all = lanesOf(knowledge.data.items)
  const lanes = lanesOf(knowledge.data.items, project)

  return (
    <div className="app-page app-page--wide">
      <h1 className="app-title">Decision log</h1>
      {noGit && (
        <Banner variant="info" title="No git history">
          Status changes come from git, so lanes show decisions without their timeline.
        </Banner>
      )}
      {decisions.data?.partial && (
        <Banner variant="warning" title="History is cut short">
          This is a shallow clone, so older status changes are missing.
        </Banner>
      )}
      <div className="kn-filters">
        <select
          aria-label="Project"
          value={project}
          onChange={(e) => setProject(e.currentTarget.value)}
        >
          <option value="">All projects</option>
          {all.map((l) => (
            <option key={l.project}>{l.project}</option>
          ))}
        </select>
      </div>
      {lanes.length === 0 ? (
        <EmptyState
          icon="gavel"
          title="No decisions yet"
          description="ADRs you record show up here, in a lane per project."
        />
      ) : (
        <div className="dec-lanes">
          {lanes.map((lane) => (
            <section key={lane.project} className="dec-lane" aria-label={lane.project}>
              <h2 className="goals-area-title">{lane.project}</h2>
              {lane.adrs.map((adr) => (
                <DecisionCard key={adr.id} adr={adr} steps={steps.get(adr.id) ?? []} />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
