import { graphAsOf } from './asof'
import { commitsByWeek, type History, type WeekCount } from './history'
import { type Lifecycle, lifecycles, type Span } from './lifecycle'
import type { Repo } from './ops/repo'
import { fieldsOf, type NodeStatus } from './views'

export interface TimelineHold {
  /** `YYYY-MM-DD`. */
  readonly from: string
  /** Missing while it is still on hold. */
  readonly to?: string
}

interface TimelineBase {
  readonly id: string
  readonly title: string
  readonly status: NodeStatus
  /** Done over all, 0 to 1. */
  readonly progress: number
  /** `YYYY-MM-DD` dates, missing when unknown. */
  readonly created?: string
  readonly started?: string
  readonly finished?: string
  readonly due?: string
  /** Not done, and its due date is before today. */
  readonly overdue: boolean
  /** Not started yet. */
  readonly planned: boolean
  readonly holds: ReadonlyArray<TimelineHold>
  /** Dates are only as early as the available history goes. */
  readonly approximate: boolean
}

export interface TimelineGoal extends TimelineBase {
  readonly horizon?: string
}

export interface TimelineProject extends TimelineBase {
  readonly goal?: string
  readonly milestone?: string
}

export interface TimelineTask extends TimelineBase {
  readonly project?: string
}

export interface TimelineDecision {
  readonly id: string
  readonly title: string
  readonly status: string
  readonly project?: string
  readonly proposed?: string
  readonly accepted?: string
  readonly ended?: string
}

export interface Timeline {
  readonly from: string
  readonly to: string
  readonly today: string
  readonly goals: ReadonlyArray<TimelineGoal>
  readonly projects: ReadonlyArray<TimelineProject>
  readonly tasks: ReadonlyArray<TimelineTask>
  readonly decisions: ReadonlyArray<TimelineDecision>
  /** Commits per week over the window, for the activity strip. */
  readonly activity: ReadonlyArray<WeekCount>
  readonly approximate: boolean
}

export interface TimelineOptions {
  /** First day of the window, `YYYY-MM-DD`. Default: the earliest date in the workspace. */
  readonly from?: string
  /** Last day of the window. Default: today, or the latest due date if that is later. */
  readonly to?: string
  /** The current moment (ISO 8601). Default: now. */
  readonly now?: string
}

const day = (iso: string | undefined) =>
  iso === undefined ? undefined : new Date(iso).toISOString().slice(0, 10)

const holdsOf = (spans: ReadonlyArray<Span>): ReadonlyArray<TimelineHold> =>
  spans
    .filter((s) => s.phase === 'blocked')
    .map((s) => ({
      from: day(s.from) as string,
      ...(s.to === undefined ? {} : { to: day(s.to) as string }),
    }))

const text = (value: unknown) => (typeof value === 'string' ? value : undefined)

/**
 * Everything the Timeline draws, in one read (ADR-00023): goals, projects, tasks and decisions
 * with their dates, holds, due dates and flags, and a weekly commit count for the activity
 * strip. Only items whose life touches the window are returned. Overdue and planned are decided
 * here, from today, so every client agrees.
 */
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
    const finished = status === 'done' ? (day(l?.finished) ?? undefined) : undefined
    return {
      id: row.node.id,
      title: row.node.title,
      status,
      progress: row.node.progress ?? 0,
      ...(created === undefined ? {} : { created }),
      ...(started === undefined ? {} : { started }),
      ...(finished === undefined ? {} : { finished }),
      ...(due === undefined ? {} : { due }),
      overdue: status !== 'done' && due !== undefined && due < today,
      planned: status !== 'done' && started === undefined,
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
    if (item.status !== 'done' || item.finished !== undefined) return item
    const finished = latest(children.map((c) => c.finished))
    return finished === undefined ? item : { ...item, finished }
  }

  const tasks = rows
    .filter((r) => r.node.type === 'task')
    .map(
      (r): TimelineTask => ({
        ...base(r),
        ...(r.node.parent === undefined ? {} : { project: r.node.parent }),
      }),
    )
  const projects = rows
    .filter((r) => r.node.type === 'project')
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
    .filter((r) => r.node.type === 'goal')
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
      .filter((r) => r.node.type === 'adr')
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
