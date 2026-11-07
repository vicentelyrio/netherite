import {
  appendActivity,
  freshnessCache,
  type History,
  type OpEnv,
  type Repo,
  readHistory,
  type ScannedItem,
  withWorkingTree,
} from '@netherite/core'
import { Effect } from 'effect'
import { describeError, failure, ok } from '../errors'
import type { McpOptions, ToolContext, Written } from './server.types'

const isoDate = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/u
const baseHashArg = 'base_hash'
const activityActor = 'mcp'

const toWritten = (value: unknown): Written | undefined => {
  const v = value as
    | { id?: unknown; path?: unknown; hash?: unknown; changed?: unknown; unchanged?: unknown }
    | undefined
  if (typeof v?.id !== 'string' || typeof v.path !== 'string' || v.unchanged === true) {
    return undefined
  }
  return {
    id: v.id,
    path: v.path,
    hash: typeof v.hash === 'string' ? v.hash : null,
    changed: Array.isArray(v.changed) ? (v.changed as string[]) : [v.path],
  }
}

export const recordActivity = (
  ctx: Pick<ToolContext, 'repo' | 'run' | 'options'>,
  tool: string,
  entry: Written,
) =>
  ctx.options.activity === false
    ? Promise.resolve()
    : ctx
        .run(
          Effect.result(
            appendActivity(ctx.repo.workspace, { tool, actor: activityActor, ...entry }),
          ),
        )
        .then((outcome) => {
          if (outcome._tag === 'Failure') {
            console.error(
              '[netherite mcp] could not write the activity log:',
              outcome.failure.message,
            )
          }
        })

export const createToolContext = (
  repo: Repo,
  options: McpOptions,
  run: ToolContext['run'],
): ToolContext => {
  const cache = freshnessCache(repo, options.git)
  let cachedHistory: { head: string | undefined; history: History } | undefined
  let written: Written | undefined

  const history = () =>
    run(
      Effect.gen(function* () {
        const git = options.git
        if (git === undefined) return undefined
        const head = yield* git.head
        const hit = cachedHistory
        if (hit !== undefined && hit.head === head) {
          return withWorkingTree(hit.history, repo.index, new Date().toISOString())
        }
        const read = yield* readHistory(git, repo.workspace.root, {
          contentRoot: repo.contentRoot,
        })
        cachedHistory = { head, history: read }
        return withWorkingTree(read, repo.index, new Date().toISOString())
      }),
    )

  return {
    repo,
    options,
    run,
    cache,
    freshness: () => run(cache.get) as ReturnType<ToolContext['freshness']>,
    history: history as ToolContext['history'],
    asOfProblem: (value) =>
      value !== undefined && (!isoDate.test(value) || Number.isNaN(Date.parse(value)))
        ? describeError({
            _tag: 'ValidationError',
            issues: [{ path: ['as_of'], message: 'Use a date such as 2026-03-01' }],
          })
        : undefined,
    noHistory: () =>
      describeError({
        _tag: 'Unavailable',
        message: 'as_of needs a workspace in a git repository.',
      }),
    locate: (id) => {
      const found = repo.index.findById(id)
      if (found.length === 0) {
        return {
          error: describeError({ _tag: 'NotFound', message: `No item has the ID ${id}`, id }),
        }
      }
      if (found.length > 1) {
        return {
          error: describeError({
            _tag: 'AmbiguousId',
            message: `${id} is used by ${found.length} items`,
            id,
            paths: found.map((i) => i.path),
          }),
        }
      }
      return { item: found[0] as ScannedItem }
    },
    withHash: (r) => r.string(baseHashArg),
    effectTool: (build, format) => async (r) => {
      const effect = build(r)
      const problem = r.check()
      if (problem !== undefined) return describeError(problem)
      if (effect === undefined) return failure({ type: 'InternalError', message: 'Nothing to do' })
      const outcome = await run(Effect.result(effect as Effect.Effect<never, unknown, OpEnv>))
      if (outcome._tag === 'Failure') return describeError(outcome.failure)
      cache.invalidate()
      written = toWritten(outcome.success)
      return ok(format(outcome.success))
    },
    noteWrite: (value) => {
      written = toWritten(value)
    },
    written: () => written,
    clearWritten: () => {
      written = undefined
    },
  }
}
