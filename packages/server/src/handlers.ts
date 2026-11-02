import {
  Failure,
  Invalid,
  NetheriteApi,
  NotFound,
  Refused,
  Unavailable,
  type WriteResult,
} from '@netherite/api'
import {
  adrActivityByWeek,
  completionsByWeek,
  createItem,
  decisionLog,
  deleteItem,
  fieldsOf,
  graphOf,
  groupActivity,
  type History,
  itemDetail,
  itemJsonSchemas,
  itemSummary,
  itemTypes,
  link,
  lint,
  listItems,
  markReviewed,
  type OpResult,
  progressSeries,
  readActivity,
  type ScannedItem,
  searchItems,
  setState,
  summarize,
  toggleChecklistItem,
  unlink,
  updateItem,
} from '@netherite/core'
import { Effect, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { toApiError } from './errors'
import type { ServerState } from './state'

const written = (r: OpResult): WriteResult => ({
  id: r.id,
  path: r.path,
  hash: r.hash,
  changed: r.changed,
  unchanged: r.unchanged,
})

const invalid = (path: ReadonlyArray<string | number>, message: string) =>
  new Invalid({ message, issues: [{ path: [...path], message }] })

/** A write: runs alone, maps core failures to API errors, and refreshes what was cached. */
const write =
  (state: ServerState) =>
  <E, R>(effect: Effect.Effect<OpResult, E, R>) =>
    state.writes.withPermits(1)(
      effect.pipe(
        Effect.mapError(toApiError),
        Effect.tap(() => Effect.sync(() => state.freshness.invalidate())),
        Effect.map(written),
      ),
    )

const locate = (state: ServerState, id: string) => {
  const found = state.repo.index.findById(id)
  if (found.length === 0)
    return Effect.fail(new NotFound({ message: `No item has the ID ${id}`, id }))
  if (found.length > 1) {
    return Effect.fail(
      new Refused({
        message: `${id} is used by ${found.length} items`,
        reason: 'ambiguous-id',
        paths: found.map((i) => i.path),
      }),
    )
  }
  return Effect.succeed(found[0] as ScannedItem)
}

const noGit = () => new Unavailable({ message: 'This workspace is not in a git repository.' })

const items = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'items', (handlers) => {
    const w = write(state)
    return handlers
      .handle('list', ({ query }) => {
        const limit = query.limit ?? 50
        const offset = query.offset ?? 0
        if (!Number.isInteger(limit) || limit < 1 || limit > 500)
          return Effect.fail(invalid(['limit'], 'Must be a whole number from 1 to 500'))
        if (!Number.isInteger(offset) || offset < 0)
          return Effect.fail(invalid(['offset'], 'Must be a whole number, 0 or more'))
        const page = listItems(state.repo, { ...query, limit, offset })
        return Effect.succeed({
          total: page.total,
          offset: page.offset,
          items: page.items.flatMap((i) =>
            i.id === undefined || i.type === undefined
              ? []
              : [{ ...i, id: i.id, type: i.type, title: i.title ?? i.id }],
          ),
        })
      })
      .handle('get', ({ params }) =>
        Effect.gen(function* () {
          const item = yield* locate(state, params.id)
          const detail = itemDetail(state.repo, item, yield* state.freshness.get)
          return {
            ...detail,
            id: detail.id ?? params.id,
            type: detail.type ?? '',
            title: detail.title ?? params.id,
          }
        }),
      )
      .handle('create', ({ payload }) =>
        w(
          createItem(state.repo, {
            type: payload.type,
            title: payload.title,
            ...(payload.fields === undefined ? {} : { fields: payload.fields as never }),
            ...(payload.body === undefined ? {} : { body: payload.body }),
            ...((payload.createdBy ?? state.createdBy) === undefined
              ? {}
              : { createdBy: (payload.createdBy ?? state.createdBy) as string }),
          }),
        ),
      )
      .handle('update', ({ params, payload }) =>
        Effect.gen(function* () {
          if (
            payload.set === undefined &&
            payload.unset === undefined &&
            payload.section === undefined
          ) {
            return yield* invalid([], 'Give at least one of set, unset or section')
          }
          const patch = updateItem(
            state.repo,
            params.id,
            {
              ...(payload.set ? { set: payload.set as never } : {}),
              ...(payload.unset ? { unset: payload.unset } : {}),
              ...(payload.section
                ? {
                    section: {
                      heading: payload.section.heading,
                      content: payload.section.content,
                      mode: payload.section.mode ?? 'replace',
                    },
                  }
                : {}),
            },
            payload.baseHash ? { baseHash: payload.baseHash } : {},
          )
          return yield* w(
            patch.pipe(
              Effect.flatMap((r) =>
                r === undefined ? Effect.die('empty patch') : Effect.succeed(r),
              ),
            ),
          )
        }),
      )
      .handle('setState', ({ params, payload }) =>
        w(
          setState(state.repo, params.id, payload.state, {
            ...(payload.supersededBy ? { supersededBy: payload.supersededBy } : {}),
            ...(payload.baseHash ? { baseHash: payload.baseHash } : {}),
          }),
        ),
      )
      .handle('toggleCheck', ({ params, payload }) => {
        const which =
          typeof payload.item === 'number'
            ? payload.item
            : payload.item === ''
              ? undefined
              : { text: payload.item }
        if (which === undefined || (typeof which === 'number' && which < 0)) {
          return Effect.fail(
            invalid(['item'], 'Give the 0-based position or the exact text of the checklist item'),
          )
        }
        return w(
          toggleChecklistItem(
            state.repo,
            params.id,
            which,
            payload.checked,
            payload.baseHash ? { baseHash: payload.baseHash } : {},
          ),
        )
      })
      .handle('link', ({ params, payload }) =>
        w(
          link(
            state.repo,
            { from: params.id, to: payload.to, kind: payload.kind },
            payload.baseHash ? { baseHash: payload.baseHash } : {},
          ),
        ),
      )
      .handle('unlink', ({ params, query }) =>
        w(
          unlink(
            state.repo,
            { from: params.id, to: query.to, kind: query.kind },
            query.baseHash ? { baseHash: query.baseHash } : {},
          ),
        ),
      )
      .handle('markReviewed', ({ params, payload }) => {
        if (payload.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(payload.date))
          return Effect.fail(invalid(['date'], 'Must be a date like 2026-03-05'))
        return w(
          markReviewed(state.repo, params.id, {
            ...(payload.date ? { date: payload.date } : {}),
            ...(payload.baseHash ? { baseHash: payload.baseHash } : {}),
          }),
        )
      })
      .handle('delete', ({ params, query }) =>
        state.writes.withPermits(1)(
          deleteItem(state.repo, params.id, {
            ...(query.force === 'true' ? { force: true } : {}),
            ...(query.baseHash ? { baseHash: query.baseHash } : {}),
          }).pipe(
            Effect.mapError(toApiError),
            Effect.tap(() => Effect.sync(() => state.freshness.invalidate())),
            Effect.map((d) => ({ deleted: d.id, path: d.path })),
          ),
        ),
      )
  })

const search = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'search', (handlers) =>
    handlers.handle('search', ({ query }) => {
      const limit = query.limit ?? 20
      if (!Number.isInteger(limit) || limit < 1 || limit > 100)
        return Effect.fail(invalid(['limit'], 'Must be a whole number from 1 to 100'))
      const types = query.types
        ?.split(',')
        .map((t) => t.trim())
        .filter((t) => t !== '')
      const unknown = types?.find((t) => !(itemTypes as ReadonlyArray<string>).includes(t))
      if (unknown !== undefined) return Effect.fail(invalid(['types'], `Unknown type "${unknown}"`))
      const found = searchItems(state.repo, query.q, { ...query, types, limit })
      return Effect.succeed({
        total: found.total,
        results: found.results.flatMap((r) =>
          r.id === undefined || r.type === undefined
            ? []
            : [{ ...r, id: r.id, type: r.type, title: r.title ?? r.id }],
        ),
      })
    }),
  )

const graph = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'graph', (handlers) =>
    handlers.handle('graph', () => Effect.sync(() => graphOf(state.repo))),
  )

const lintReport = (state: ServerState, only?: string) =>
  Effect.gen(function* () {
    const fresh = yield* state.freshness.get
    const diagnostics = lint(state.repo.index, {
      config: state.repo.workspace.config,
      contentRoot: state.repo.contentRoot,
      ...(only ? { only: [only] } : {}),
      ...(fresh ? { freshness: fresh } : {}),
    })
    return { summary: summarize(diagnostics), diagnostics }
  })

const lintGroup = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'lint', (handlers) =>
    handlers.handle('lint', ({ query }) =>
      Effect.gen(function* () {
        const only = query.id === undefined ? undefined : (yield* locate(state, query.id)).path
        return yield* lintReport(state, only)
      }),
    ),
  )

const gitChange = (e: { kind: string; index: string; worktree: string }) => {
  if (e.kind === 'untracked') return 'untracked'
  if (e.kind === 'renamed') return 'renamed'
  const letters = `${e.index}${e.worktree}`
  if (letters.includes('D')) return 'deleted'
  if (letters.includes('A')) return 'added'
  return 'modified'
}

const inbox = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'inbox', (handlers) =>
    handlers.handle('inbox', ({ query }) =>
      Effect.gen(function* () {
        const { repo } = state
        if (query.since !== undefined && Number.isNaN(Date.parse(query.since)))
          return yield* invalid(['since'], 'Must be a date and time like 2026-03-05T10:30:00Z')

        const summaries = (list: ReadonlyArray<ScannedItem>) =>
          list.flatMap((item) => {
            const s = itemSummary(item)
            return s.id === undefined || s.type === undefined
              ? []
              : [{ ...s, id: s.id, type: s.type, title: s.title ?? s.id }]
          })

        // Uncommitted changes to items.
        const folder = repo.contentRoot
        const status = state.git
          ? yield* state.git.status().pipe(Effect.orElseSucceed(() => undefined))
          : undefined
        const changes = (status?.entries ?? [])
          .filter(
            (e) =>
              e.kind !== 'ignored' && e.path.startsWith(`${folder}/`) && e.path.endsWith('.md'),
          )
          .map((e) => {
            const item = repo.index.get(e.path)
            return {
              path: e.path,
              change: gitChange(e),
              ...(item?.id ? { id: item.id } : {}),
              ...(item?.title ? { title: item.title } : {}),
              ...(item?.type ? { type: item.type } : {}),
            }
          })

        const log = yield* readActivity(
          repo.workspace,
          query.since ? { since: query.since } : {},
        ).pipe(Effect.mapError(gitFailure))
        const fresh = yield* state.freshness.get
        const states = repo.workspace.config.states
        const blockedStates = new Set(
          states.filter((s) => s.category === 'blocked').map((s) => s.name),
        )
        const all = repo.index.items()

        return {
          changes,
          activity: groupActivity(log.entries),
          proposed: summaries(
            all.filter((i) => i.type === 'adr' && fieldsOf(i).status === 'proposed'),
          ),
          freshness: [...(fresh ?? new Map()).entries()].flatMap(([path, f]) => {
            const item = repo.index.get(path)
            return item?.id && (f.state === 'drifting' || f.state === 'stale')
              ? [
                  {
                    id: item.id,
                    title: item.title ?? item.id,
                    path,
                    state: f.state,
                    commits: f.commits,
                  },
                ]
              : []
          }),
          orphans: summaries(all.filter((i) => repo.index.isOrphan(i.path))),
          errors: (yield* lintReport(state)).diagnostics.filter((d) => d.severity === 'error'),
          blocked: summaries(
            all.filter(
              (i) => i.type === 'task' && blockedStates.has(String(fieldsOf(i).state ?? '')),
            ),
          ),
        }
      }),
    ),
  )

const gitFailure = (e: unknown) =>
  new Failure({
    message: e instanceof Error ? e.message : String((e as { message?: string }).message ?? e),
  })

const withHistory = <A, E>(state: ServerState, use: (history: History) => Effect.Effect<A, E>) =>
  Effect.gen(function* () {
    if (state.git === undefined) return yield* noGit()
    const history = yield* state.history.pipe(Effect.mapError(gitFailure))
    if (history === undefined) return yield* noGit()
    return yield* use(history)
  })

const history = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'history', (handlers) =>
    handlers
      .handle('decisions', ({ query }) =>
        withHistory(state, (h) => {
          const inProject = (id: string) => {
            if (query.project === undefined) return true
            const item = state.repo.index.findById(id)[0]
            return item !== undefined && fieldsOf(item).project === query.project
          }
          return Effect.succeed({
            partial: h.partial,
            transitions: decisionLog(h).filter((t) => inProject(t.id)),
          })
        }),
      )
      .handle('item', ({ params }) =>
        withHistory(state, (h) => {
          const item = h.items.get(params.id)
          if (item === undefined)
            return Effect.fail(
              new NotFound({ message: `No history for ${params.id}`, id: params.id }),
            )
          return Effect.succeed({
            id: item.id,
            paths: item.paths,
            commits: item.commits,
            ...(item.created ? { created: item.created } : {}),
            ...(item.deletedAt ? { deletedAt: item.deletedAt } : {}),
            transitions: item.transitions,
            authors: item.authors,
          })
        }),
      ),
  )

const stats = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'stats', (handlers) =>
    handlers.handle('stats', ({ query }) =>
      withHistory(state, (h) => {
        const date = /^\d{4}-\d{2}-\d{2}$/
        for (const key of ['from', 'to'] as const) {
          const v = query[key]
          if (v !== undefined && !date.test(v))
            return Effect.fail(invalid([key], 'Must be a date like 2026-03-05'))
        }
        const range = {
          ...(query.from ? { from: query.from } : {}),
          ...(query.to ? { to: query.to } : {}),
        }
        const done = new Set(
          state.repo.workspace.config.states
            .filter((s) => s.category === 'done')
            .map((s) => s.name),
        )
        const series = progressSeries(h, done, range)
        return Effect.succeed({
          partial: h.partial,
          completions: completionsByWeek(h, done, range),
          adrs: adrActivityByWeek(h, range),
          progress: {
            projects: Object.fromEntries(series.projects),
            goals: Object.fromEntries(series.goals),
          },
        })
      }),
    ),
  )

const meta = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'meta', (handlers) =>
    handlers
      .handle('health', () =>
        Effect.succeed({
          name: 'netherite' as const,
          version: state.version,
          root: state.repo.workspace.root,
          items: state.repo.index.size(),
          git: state.git !== undefined,
        }),
      )
      .handle('schema', ({ params }) => {
        const schemas = itemJsonSchemas(state.repo.schemas) as unknown as Record<string, unknown>
        const schema = schemas[params.type]
        return schema === undefined
          ? Effect.fail(
              new NotFound({ message: `No schema for type "${params.type}"`, id: params.type }),
            )
          : Effect.succeed(schema)
      }),
  )

/** The handlers for every group of the API, over one repository. */
export const handlersLayer = (state: ServerState) =>
  Layer.mergeAll(
    items(state),
    search(state),
    graph(state),
    lintGroup(state),
    inbox(state),
    history(state),
    stats(state),
    meta(state),
  )

/** The whole API as a layer: add it to an `HttpRouter` and serve it. */
export const apiLayer = (state: ServerState) =>
  HttpApiBuilder.layer(NetheriteApi, { openapiPath: '/api/openapi.json' }).pipe(
    Layer.provide(handlersLayer(state)),
  )
