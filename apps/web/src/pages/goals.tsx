import type { GoalRow, ProjectRow } from '@netherite/api'
import { NotFound } from '@netherite/api'
import {
  Banner,
  Button,
  Card,
  EmptyState,
  Icon,
  type ItemTypeName,
  Progress,
  ProgressRing,
} from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { useApi } from '../lib/app-context'
import { goalQuery, goalsQuery, graphQuery } from '../lib/queries'
import { useWrite } from '../lib/writes'
import { nodeTitle, RadialGraph } from './radial-graph'

const noArea = 'No area'

/** Goals grouped by area, in the order the server sends them (areas by name, no area last). */
export const groupByArea = (goals: ReadonlyArray<GoalRow>) => {
  const groups = new Map<string, GoalRow[]>()
  for (const goal of goals) {
    const area = goal.area ?? noArea
    groups.set(area, [...(groups.get(area) ?? []), goal])
  }
  return [...groups].map(([area, rows]) => ({ area, goals: rows }))
}

const sum = (goals: ReadonlyArray<GoalRow>) =>
  goals.reduce(
    (acc, g) => ({
      done: acc.done + (g.progress?.done ?? 0),
      total: acc.total + (g.progress?.total ?? 0),
    }),
    { done: 0, total: 0 },
  )

function GoalCard({ goal }: { readonly goal: GoalRow }) {
  const achieved = goal.status === 'achieved'
  const progress = goal.progress ?? { done: 0, total: 0 }
  return (
    <Link to="/goals/$id" params={{ id: goal.id }} className="app-row-link">
      <Card interactive>
        <div className="goal-card">
          <div className="goal-card-horizon">
            <Icon name={goal.due ? 'hourglass_empty' : 'all_inclusive'} />
            <span>{goal.due ? `Due ${goal.due}` : 'Ongoing'}</span>
            {achieved && <span className="goal-achieved">Achieved</span>}
          </div>
          <div className="goal-card-title">{goal.title}</div>
          {goal.tags.length > 0 && (
            <div className="goal-tags">
              {goal.tags.map((tag) => (
                <span key={tag} className="goal-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <Progress done={achieved ? 1 : progress.done} total={achieved ? 1 : progress.total} />
          <code className="app-id">{goal.id}</code>
        </div>
      </Card>
    </Link>
  )
}

/** Asks for a title in place, then hands it over. Escape or an empty title cancels. */
function TitleForm({
  label,
  onSubmit,
  onCancel,
}: {
  readonly label: string
  readonly onSubmit: (title: string) => void
  readonly onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (trimmed === '') return
    onSubmit(trimmed)
  }
  return (
    <form className="goal-title-form" onSubmit={submit}>
      <input
        className="goal-title-input"
        aria-label={label}
        placeholder={label}
        value={title}
        // biome-ignore lint/a11y/noAutofocus: the form appears because the person asked for it
        autoFocus
        onChange={(e) => setTitle(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      />
      <Button variant="primary" type="submit">
        Create
      </Button>
    </form>
  )
}

export function GoalsPage() {
  const api = useApi()
  const query = useQuery(goalsQuery(api))
  const create = useWrite(api, (a, title: string) =>
    a.call((c) => c.items.create({ payload: { type: 'goal', title } })),
  )
  const [adding, setAdding] = useState(false)

  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    return (
      <div className="app-page">
        <Banner variant="danger" title="Could not load goals">
          Check that `netherite serve` is still running.
        </Banner>
      </div>
    )
  }
  const groups = groupByArea(query.data.goals)
  return (
    <div className="app-page">
      <h1 className="app-title">Goals</h1>
      {groups.length === 0 && (
        <EmptyState
          icon="track_changes"
          title="No goals yet"
          description="A goal is something you want to reach. Projects and tasks hang from it."
        />
      )}
      <div className="goals-columns">
        {groups.map(({ area, goals }) => {
          const total = sum(goals)
          return (
            <section key={area} className="goals-area" aria-label={area}>
              <header className="goals-area-head">
                <h2 className="goals-area-title">{area}</h2>
                <ProgressRing done={total.done} total={total.total} size={56} label={area} />
              </header>
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </section>
          )
        })}
      </div>
      {adding ? (
        <TitleForm
          label="Goal title"
          onCancel={() => setAdding(false)}
          onSubmit={(title) => create.mutate(title, { onSuccess: () => setAdding(false) })}
        />
      ) : (
        <button type="button" className="goals-new" onClick={() => setAdding(true)}>
          <Icon name="add" /> New goal
        </button>
      )}
    </div>
  )
}

function ProjectCard({ project }: { readonly project: ProjectRow }) {
  const progress = project.progress ?? { done: 0, total: 0 }
  return (
    <Link to="/items/$id" params={{ id: project.id }} className="app-row-link">
      <Card interactive>
        <div className="goal-card">
          <div className="goal-card-title">{project.title}</div>
          <Progress done={progress.done} total={progress.total} />
          <code className="app-id">{project.id}</code>
        </div>
      </Card>
    </Link>
  )
}

function FocusedGraph({
  goal,
}: {
  readonly goal: { id: string; title: string; projectRows: ReadonlyArray<ProjectRow> }
}) {
  const api = useApi()
  const query = useQuery(graphQuery(api))
  if (!query.data) return <div className="goal-graph app-muted">Loading graph…</div>
  const { edges, nodes } = query.data
  const tasksOf = (id: string) =>
    edges
      .filter((e) => e.kind === 'belongs_to' && e.to === id)
      .map((e) => ({ id: e.from, type: 'task' as ItemTypeName, title: nodeTitle(nodes, e.from) }))
  return (
    <RadialGraph
      label={`${goal.title}: projects and tasks`}
      root={{ id: goal.id, type: 'goal', title: goal.title }}
      branches={goal.projectRows.map((p) => ({
        id: p.id,
        type: 'project' as ItemTypeName,
        title: p.title,
        leaves: tasksOf(p.id),
      }))}
    />
  )
}

export function GoalPage({ id }: { readonly id: string }) {
  const api = useApi()
  const query = useQuery(goalQuery(api, id))
  const [adding, setAdding] = useState(false)
  const createProject = useWrite(api, (a, title: string) =>
    a.call((c) => c.items.create({ payload: { type: 'project', title, fields: { goals: [id] } } })),
  )
  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    const missing = query.error instanceof NotFound
    return (
      <div className="app-page">
        <Banner
          variant={missing ? 'warning' : 'danger'}
          title={missing ? `No goal ${id}` : 'Could not load this goal'}
        >
          <Link to="/goals">Back to goals</Link>
        </Banner>
      </div>
    )
  }
  const goal = query.data
  const progress = goal.progress ?? { done: 0, total: 0 }
  return (
    <div className="app-page goal-detail">
      <div className="goal-detail-main">
        <nav className="goal-crumbs" aria-label="Breadcrumb">
          <Link to="/goals">Goals</Link>
          {goal.area && <span> / {goal.area}</span>}
          <span> / {goal.title}</span>
        </nav>
        <h1 className="app-title">{goal.title}</h1>
        <div className="goal-rings">
          <div className="goal-ring">
            <ProgressRing done={progress.done} total={progress.total} size={64} label="Progress" />
            <span className="app-muted">Progress</span>
          </div>
          <div className="goal-ring">
            <span className="goal-horizon">{goal.due ?? 'Ongoing'}</span>
            <span className="app-muted">Horizon</span>
          </div>
        </div>
        <header className="goal-projects-head">
          <h2 className="goals-area-title">Projects</h2>
          <span className="goal-count">{goal.projectRows.length}</span>
          <Button size="sm" icon="add" onClick={() => setAdding(true)}>
            New project
          </Button>
        </header>
        {adding && (
          <TitleForm
            label="Project title"
            onCancel={() => setAdding(false)}
            onSubmit={(title) => createProject.mutate(title, { onSuccess: () => setAdding(false) })}
          />
        )}
        {goal.projectRows.length === 0 && <p className="app-muted">No projects yet.</p>}
        {goal.projectRows.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <FocusedGraph goal={goal} />
    </div>
  )
}
