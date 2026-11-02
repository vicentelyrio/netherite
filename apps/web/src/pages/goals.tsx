import type { GoalRow, ProjectRow } from '@netherite/api'
import { NotFound } from '@netherite/api'
import { Banner, Button, Card, EmptyState, Icon, ProgressRing } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type FormEvent, type ReactNode, useState } from 'react'
import { GraphView } from '../graph/GraphView'
import { useApi } from '../lib/app-context'
import { Bar, Tags } from '../lib/bits'
import { goalQuery, goalsQuery, graphQuery } from '../lib/queries'
import { TitleForm } from '../lib/title-form'
import { useWrite } from '../lib/writes'

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

export function Crumbs({ children }: { readonly children?: ReactNode }) {
  return (
    <nav className="goal-crumbs" aria-label="Breadcrumb">
      <Icon name="track_changes" />
      {children}
    </nav>
  )
}

function GoalCard({ goal }: { readonly goal: GoalRow }) {
  const achieved = goal.status === 'achieved'
  const progress = goal.progress ?? { done: 0, total: 0 }
  return (
    <Link to="/goals/$id" params={{ id: goal.id }} className="app-row-link">
      <Card interactive>
        <div className="goal-card">
          <div className="goal-card-top">
            <span className="goal-card-title">{goal.title}</span>
            {achieved && <span className="goal-achieved">Achieved</span>}
          </div>
          {goal.due && <span className="app-muted">Due {goal.due}</span>}
          <Tags tags={goal.tags} />
          <Bar
            done={achieved ? progress.total || 1 : progress.done}
            total={progress.total || (achieved ? 1 : 0)}
          />
        </div>
      </Card>
    </Link>
  )
}

function NewGoal({ area }: { readonly area: string | undefined }) {
  const api = useApi()
  const [adding, setAdding] = useState(false)
  const create = useWrite(api, (a, title: string) =>
    a.call((c) =>
      c.items.create({
        payload: { type: 'goal', title, ...(area ? { fields: { area } } : {}) },
      }),
    ),
  )
  return adding ? (
    <TitleForm
      label="Goal title"
      onCancel={() => setAdding(false)}
      onSubmit={(title) => create.mutate(title, { onSuccess: () => setAdding(false) })}
    />
  ) : (
    <button type="button" className="goals-new" onClick={() => setAdding(true)}>
      <Icon name="add" /> New goal
    </button>
  )
}

/**
 * An area exists because a goal names it, so a new area starts with its first goal: the form asks
 * for both. Areas already in use are offered so a typo does not make a second one.
 */
function NewArea({ areas }: { readonly areas: ReadonlyArray<string> }) {
  const api = useApi()
  const [adding, setAdding] = useState(false)
  const [area, setArea] = useState('')
  const [title, setTitle] = useState('')
  const create = useWrite(api, (a, v: { area: string; title: string }) =>
    a.call((c) =>
      c.items.create({ payload: { type: 'goal', title: v.title, fields: { area: v.area } } }),
    ),
  )
  const clash = areas.some((a) => a.toLowerCase() === area.trim().toLowerCase())
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (area.trim() === '' || title.trim() === '') return
    create.mutate(
      { area: area.trim(), title: title.trim() },
      {
        onSuccess: () => {
          setAdding(false)
          setArea('')
          setTitle('')
        },
      },
    )
  }
  if (!adding) {
    return (
      <button type="button" className="goals-new goals-new-area" onClick={() => setAdding(true)}>
        <Icon name="add" /> New area
      </button>
    )
  }
  return (
    <form className="goals-area-form" onSubmit={submit} aria-label="New area">
      <input
        className="goal-title-input"
        aria-label="Area name"
        placeholder="Area name"
        value={area}
        // biome-ignore lint/a11y/noAutofocus: the form appears because the person asked for it
        autoFocus
        onChange={(e) => setArea(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
      />
      {clash && <span className="app-muted">That area exists: the goal will join it.</span>}
      <input
        className="goal-title-input"
        aria-label="First goal"
        placeholder="First goal"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
      />
      <Button variant="primary" type="submit">
        Create area
      </Button>
    </form>
  )
}

export function GoalsPage() {
  const api = useApi()
  const query = useQuery(goalsQuery(api))

  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    return (
      <div className="app-page app-page--wide">
        <Banner variant="danger" title="Could not load goals">
          Check that `netherite serve` is still running.
        </Banner>
      </div>
    )
  }
  const groups = groupByArea(query.data.goals)
  return (
    <div className="app-page app-page--wide">
      <Crumbs>
        <h1 className="goal-crumb-title">Goals</h1>
      </Crumbs>
      {groups.length === 0 && (
        <>
          <EmptyState
            icon="track_changes"
            title="No goals yet"
            description="A goal is something you want to reach. Projects and tasks hang from it."
          />
          <NewGoal area={undefined} />
        </>
      )}
      <div className="goals-columns">
        {groups.map(({ area, goals }) => {
          const total = sum(goals)
          return (
            <section key={area} className="goals-area" aria-label={area}>
              <header className="goals-area-head">
                <h2 className="goals-area-title">{area}</h2>
                <ProgressRing done={total.done} total={total.total} size={58} label={area} />
              </header>
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
              <NewGoal area={area === noArea ? undefined : area} />
            </section>
          )
        })}
        <NewArea areas={groups.map((g) => g.area).filter((a) => a !== noArea)} />
      </div>
    </div>
  )
}

function ProjectCard({ project }: { readonly project: ProjectRow }) {
  const progress = project.progress ?? { done: 0, total: 0 }
  return (
    <Link to="/projects/$id" params={{ id: project.id }} className="app-row-link">
      <Card interactive>
        <div className="goal-card">
          {project.goals.length > 0 && (
            <span className="goal-overline">{project.goals.map((g) => g.title).join(' · ')}</span>
          )}
          <span className="goal-card-title">{project.title}</span>
          <Tags tags={project.tags} />
          <Bar done={progress.done} total={progress.total} />
        </div>
      </Card>
    </Link>
  )
}

function FocusedGraph({ goal }: { readonly goal: { id: string; title: string } }) {
  const api = useApi()
  const query = useQuery(graphQuery(api))
  if (!query.data) return <div className="gv app-muted">Loading graph…</div>
  return (
    <GraphView
      data={query.data}
      variant="embedded"
      focus={goal.id}
      labels="neighbors"
      nodeScale={1.25}
      pad={96}
      label={`${goal.title}: projects and tasks`}
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
      <div className="app-page app-page--wide">
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
    <div className="app-page app-page--wide goal-detail">
      <div className="goal-detail-main">
        <Crumbs>
          <Link to="/goals">Goals</Link>
          {goal.area && <span> / {goal.area}</span>}
          <span> / </span>
          <strong>{goal.title}</strong>
        </Crumbs>
        <header className="goal-head">
          <h1 className="app-title goal-title">{goal.title}</h1>
          <div className="goal-ring">
            <ProgressRing done={progress.done} total={progress.total} size={64} label="Progress" />
            <span className="app-muted">Progress</span>
          </div>
        </header>
        <header className="goal-projects-head">
          <h2 className="goal-projects-title">Projects</h2>
          <span className="goal-count">{goal.projectRows.length}</span>
          <button type="button" className="goal-link-button" onClick={() => setAdding(true)}>
            <Icon name="add" /> New project
          </button>
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
