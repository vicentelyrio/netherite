import { ItemType, ProgressStatus, StateCategoryName } from '@netherite/schema'
import { graphAsOf } from '../asof'
import { commitsByWeek, type History } from '../history'
import { type Lifecycle, lifecycles, type Span } from '../lifecycle'
import type { Repo } from '../ops/repo'
import { fieldsOf } from '../views'
import type {
  Timeline,
  TimelineBase,
  TimelineDecision,
  TimelineGoal,
  TimelineHold,
  TimelineOptions,
  TimelineProject,
  TimelineTask,
} from './timeline.types'

const day = (iso: string | undefined) =>
  iso === undefined ? undefined : new Date(iso).toISOString().slice(0, 10)

const holdsOf = (spans: ReadonlyArray<Span>): ReadonlyArray<TimelineHold> =>
  spans
    .filter((s) => s.phase === StateCategoryName.Blocked)
    .map((s) => ({
      from: day(s.from) as string,
      ...(s.to === undefined ? {} : { to: day(s.to) as string }),
    }))

const text = (value: unknown) => (typeof value === 'string' ? value : undefined)

export const timelineOf = (
  repo: Repo,
  history: History,
  options: TimelineOptions = {},
): Timeline => {
  const nowIso = options.now ?? new Date().toISOString()
  const today = day(nowIso) as string
  const life = lifecycles(history, { states: repo.workspace.config.states, now: nowIso })
  const standing = new Map(
    graphAsOf(repo, history, { asOf: nowIso, now: nowIso }).nodes.map((n) => [n.id, n]),
  )

  const rows = [...standing.values()].flatMap((node) => {
    const item = repo.index.findById(node.id)[0]
    if (item === undefined) return []
    return [{ node, fields: fieldsOf(item), life: life.get(node.id) as Lifecycle | undefined }]
  })

  const base = (row: (typeof rows)[number]): TimelineBase => {
    const l = row.life
    const due = text(row.fields.due)
    const status = row.node.status ?? 'backlog'
    const created = day(l?.created)
    const started = day(l?.started)
    const finished = status === ProgressStatus.Done ? (day(l?.finished) ?? undefined) : undefined
    return {
      id: row.node.id,
      title: row.node.title,
      status,
      progress: row.node.progress ?? 0,
      ...(created === undefined ? {} : { created }),
      ...(started === undefined ? {} : { started }),
      ...(finished === undefined ? {} : { finished }),
      ...(due === undefined ? {} : { due }),
      overdue: status !== ProgressStatus.Done && due !== undefined && due < today,
      planned: status !== ProgressStatus.Done && started === undefined,
      holds: holdsOf(l?.spans ?? []),
      approximate: l?.approximate ?? false,
    }
  }

  const latest = (days: ReadonlyArray<string | undefined>) =>
    days
      .filter((d): d is string => d !== undefined)
      .sort()
      .at(-1)
  const withFinish = <T extends TimelineBase>(
    item: T,
    children: ReadonlyArray<TimelineBase>,
  ): T => {
    if (item.status !== ProgressStatus.Done || item.finished !== undefined) return item
    const finished = latest(children.map((c) => c.finished))
    return finished === undefined ? item : { ...item, finished }
  }

  const tasks = rows
    .filter((r) => r.node.type === ItemType.Task)
    .map(
      (r): TimelineTask => ({
        ...base(r),
        ...(r.node.parent === undefined ? {} : { project: r.node.parent }),
      }),
    )
  const projects = rows
    .filter((r) => r.node.type === ItemType.Project)
    .map((r): TimelineProject => {
      const milestone = text(r.fields.milestone)
      return withFinish(
        {
          ...base(r),
          ...(r.node.parent === undefined ? {} : { goal: r.node.parent }),
          ...(milestone === undefined ? {} : { milestone }),
        },
        tasks.filter((t) => t.project === r.node.id),
      )
    })
  const goals = rows
    .filter((r) => r.node.type === ItemType.Goal)
    .map((r): TimelineGoal => {
      const horizon = text(r.fields.horizon)
      return withFinish(
        { ...base(r), ...(horizon === undefined ? {} : { horizon }) },
        projects.filter((p) => p.goal === r.node.id),
      )
    })
  const all = {
    goals,
    projects,
    tasks,
    decisions: rows
      .filter((r) => r.node.type === ItemType.Adr)
      .map((r): TimelineDecision => {
        const project = text(r.fields.project)
        const proposed = day(r.life?.started ?? r.life?.created)
        const accepted = day(r.life?.finished)
        const ended = day(r.life?.ended)
        return {
          id: r.node.id,
          title: r.node.title,
          status: text(r.fields.status) ?? 'proposed',
          ...(project === undefined ? {} : { project }),
          ...(proposed === undefined ? {} : { proposed }),
          ...(accepted === undefined ? {} : { accepted }),
          ...(ended === undefined ? {} : { ended }),
        }
      }),
  }

  const dates = [...all.goals, ...all.projects, ...all.tasks].flatMap((i) =>
    [i.created, i.started, i.due].filter((d): d is string => d !== undefined),
  )
  const earliest = [
    ...dates,
    ...all.decisions.flatMap((d) => (d.proposed ? [d.proposed] : [])),
  ].sort()[0]
  const latestDue = dates.sort().at(-1)
  const from = options.from ?? earliest ?? today
  const to = options.to ?? (latestDue !== undefined && latestDue > today ? latestDue : today)

  const within = (start: string | undefined, end: string | undefined) => {
    const first = start ?? end ?? to
    const last = end ?? to
    return first <= to && last >= from
  }
  const span = (i: TimelineBase) =>
    within(
      i.started ?? i.created ?? i.due,
      i.finished ?? (i.due !== undefined && i.due > today ? i.due : undefined) ?? i.due,
    )

  return {
    from,
    to,
    today,
    goals: all.goals.filter(span),
    projects: all.projects.filter(span),
    tasks: all.tasks.filter(span),
    decisions: all.decisions.filter((d) => within(d.proposed, d.ended ?? d.accepted)),
    activity: commitsByWeek(history, { from, to }),
    approximate: history.partial,
  }
}
