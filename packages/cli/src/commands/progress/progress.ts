import {
  freshnessCache,
  openRepo,
  type Period,
  type PeriodStats,
  periodStats,
  readHistory,
  type Timeline,
  timelineOf,
  workspaceGit,
} from '@netherite/core'
import { Effect, Path } from 'effect'
import { reportFailure } from '../../errors'
import { type Env, type ExitCode, exitCodes, json } from '../../output'

export interface TimelineCommandOptions {
  readonly dir: string
  readonly from: string | undefined
  readonly to: string | undefined
  readonly json: boolean
}

export interface StatsCommandOptions {
  readonly dir: string
  readonly period: string
  readonly json: boolean
}

const date = /^\d{4}-\d{2}-\d{2}$/u

const periods: ReadonlyArray<Period> = ['30d', 'quarter', 'year']

const noGit = (env: Env) => {
  env.out.error('This needs git history, and this workspace is not in a git repository.')
  return exitCodes.usage as ExitCode
}

const flag = (item: { overdue: boolean; planned: boolean }) =>
  item.overdue ? ' overdue' : item.planned ? ' planned' : ''

const timelineText = (env: Env, t: Timeline) => {
  env.out.line(`Timeline ${t.from} to ${t.to} (today ${t.today})`)
  const row = (
    indent: string,
    i: {
      id: string
      title: string
      status: string
      due?: string
      started?: string
      finished?: string
      overdue: boolean
      planned: boolean
    },
  ) =>
    env.out.line(
      `${indent}${i.id}  ${i.status.padEnd(8)} ${(i.started ?? '').padEnd(10)} → ${(i.finished ?? i.due ?? '').padEnd(10)}${flag(i)}  ${i.title}`,
    )
  for (const g of t.goals) {
    row('', g)
    for (const p of t.projects.filter((x) => x.goal === g.id)) {
      row('  ', p)
      for (const task of t.tasks.filter((x) => x.project === p.id)) row('    ', task)
    }
  }
  if (t.decisions.length > 0) {
    env.out.line('Decisions')
    for (const d of t.decisions) {
      env.out.line(
        `  ${d.id}  ${d.status.padEnd(10)} ${d.proposed ?? ''} → ${d.accepted ?? d.ended ?? ''}  ${d.title}`,
      )
    }
  }
}

const delta = (d: { value: number; previous?: number | undefined } | null, unit = '') => {
  if (d === null) return '–'
  const was = d.previous === undefined ? '' : ` (was ${d.previous}${unit})`
  return `${d.value}${unit}${was}`
}

const statsText = (env: Env, s: PeriodStats) => {
  env.out.line(`Stats ${s.from} to ${s.to} (${s.period})`)
  env.out.line(`  tasks created   ${delta(s.kpis.created)}`)
  env.out.line(`  tasks done      ${delta(s.kpis.done)}`)
  env.out.line(`  cycle time      ${delta(s.kpis.cycleDays, ' days')}`)
  env.out.line(`  commits         ${delta(s.kpis.commits)}`)
  env.out.line(`  stale docs      ${delta(s.kpis.staleDocs)}`)
  if (s.areas.length > 0) env.out.line('Goal areas')
  for (const a of s.areas) {
    env.out.line(
      `  ${a.area.padEnd(14)} ${Math.round(a.share * 100)}% done, ${a.gained >= 0 ? '+' : ''}${a.gained} points, ${a.achieved} achieved, ${a.idle} idle`,
    )
  }
  if (s.projects.length > 0) env.out.line('Projects')
  for (const p of s.projects) {
    env.out.line(
      `  ${p.id}  ${p.done} done${p.cycleDays === null ? '' : `, median ${p.cycleDays} days`}  ${p.title}`,
    )
  }
  const f = s.knowledge.freshness
  env.out.line(
    `Knowledge: ${f.fresh} fresh, ${f.drifting} drifting, ${f.stale} stale, ${f.notTracked} not tracked`,
  )
}

export const timelineCommand = (env: Env, options: TimelineCommandOptions) =>
  Effect.gen(function* () {
    const path = yield* Path.Path
    for (const [name, value] of [
      ['--from', options.from],
      ['--to', options.to],
    ] as const) {
      if (value !== undefined && !date.test(value)) {
        env.out.error(`${name} must be a date like 2026-03-05.`)
        return exitCodes.usage as ExitCode
      }
    }
    const run = Effect.gen(function* () {
      const repo = yield* openRepo(path.resolve(env.cwd, options.dir))
      const git = yield* workspaceGit(repo.workspace)
      if (git === undefined) return noGit(env)
      const history = yield* readHistory(git, repo.workspace.root, {
        contentRoot: repo.contentRoot,
      })
      const timeline = timelineOf(repo, history, {
        ...(options.from === undefined ? {} : { from: options.from }),
        ...(options.to === undefined ? {} : { to: options.to }),
      })
      if (options.json) json(env.out, timeline)
      else timelineText(env, timeline)
      return exitCodes.ok as ExitCode
    })
    return yield* Effect.catch(run, (error) => Effect.succeed(reportFailure(env, error)))
  })

export const statsCommand = (env: Env, options: StatsCommandOptions) =>
  Effect.gen(function* () {
    const path = yield* Path.Path
    const period = periods.find((p) => p === options.period)
    if (period === undefined) {
      env.out.error('--period must be 30d, quarter or year.')
      return exitCodes.usage as ExitCode
    }
    const run = Effect.gen(function* () {
      const repo = yield* openRepo(path.resolve(env.cwd, options.dir))
      const git = yield* workspaceGit(repo.workspace)
      if (git === undefined) return noGit(env)
      const history = yield* readHistory(git, repo.workspace.root, {
        contentRoot: repo.contentRoot,
      })
      const freshness = yield* freshnessCache(repo, git).get
      const stats = periodStats(repo, history, {
        period,
        ...(freshness === undefined ? {} : { freshness }),
      })
      if (options.json) json(env.out, stats)
      else statsText(env, stats)
      return exitCodes.ok as ExitCode
    })
    return yield* Effect.catch(run, (error) => Effect.succeed(reportFailure(env, error)))
  })
