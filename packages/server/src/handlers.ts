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
  addCapture,
  adrActivityByWeek,
  boardOf,
  coChanged,
  completionsByWeek,
  createItem,
  decisionLog,
  deleteItem,
  fieldsOf,
  goalDetail,
  goalRows,
  graphAsOf,
  graphOf,
  groupActivity,
  type History,
  handleFrom,
  itemDetail,
  itemJsonSchemas,
  itemSummary,
  itemTypes,
  knowledgeRows,
  link,
  lint,
  lintText,
  listItems,
  markReviewed,
  type OpResult,
  pathMap,
  periodStats,
  progressSeries,
  projectRows,
  raised,
  readActivity,
  readCaptures,
  readSource,
  removeCapture,
  renameTag,
  replaceSource,
  type ScannedItem,
  searchItems,
  setState,
  summarize,
  summaryOf,
  supersessionChain,
  syncContext,
  tagMap,
  tagUsage,
  timelineOf,
  toggleChecklistItem,
  unlink,
  updateItem,
} from '@netherite/core'
import { Effect, Layer, PubSub, Stream } from 'effect'
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

/**
 * Something this server changed: refresh what is cached and tell connected clients. Changes made
 * by an editor or `git` reach clients through the watcher instead (see `live.ts`).
 */
export const notifyChanged = (
  state: ServerState,
  upserted: ReadonlyArray<string>,
  removed: ReadonlyArray<string>,
) =>
  Effect.gen(function* () {
    state.invalidate()
    const affected = [...new Set([...upserted, ...removed])].sort()
    yield* state.publish({
      type: 'items',
      upserted: [...upserted],
      removed: [...removed],
      affected,
      ids: affected.flatMap((p) => {
        const id = state.repo.index.get(p)?.id
        return id === undefined ? [] : [id]
      }),
    })
  })

/** A write: runs alone, maps core failures to API errors, and refreshes what was cached. */
const write =
  (state: ServerState) =>
  <E, R>(effect: Effect.Effect<OpResult, E, R>) =>
    state.writes.withPermits(1)(
      effect.pipe(
        Effect.mapError(toApiError),
        Effect.tap((r) => notifyChanged(state, r.changed, [])),
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
      .handle('source', ({ params }) =>
        Effect.gen(function* () {
          yield* locate(state, params.id)
          const source = yield* readSource(state.repo, params.id).pipe(Effect.mapError(gitFailure))
          // What git has committed, for the editor's change gutter. Without git there is none.
          const git = state.git
          const head =
            git === undefined
              ? undefined
              : yield* Effect.gen(function* () {
                  const map = yield* pathMap(git, state.repo.workspace.root)
                  return yield* git.fileAt(map.toGit(source.path))
                }).pipe(Effect.orElseSucceed(() => undefined))
          return { text: source.text, hash: source.hash, head: head ?? null }
        }),
      )
      .handle('replaceSource', ({ params, payload }) =>
        w(
          replaceSource(
            state.repo,
            params.id,
            payload.text,
            payload.baseHash ? { baseHash: payload.baseHash } : {},
          ),
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
            Effect.tap((d) => notifyChanged(state, [], [d.path])),
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
    handlers.handle('graph', ({ query }) =>
      Effect.gen(function* () {
        if (query.asOf !== undefined) {
          const asOf = query.asOf
          if (
            !/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/u.test(asOf) ||
            Number.isNaN(Date.parse(asOf))
          )
            return yield* invalid(['asOf'], 'Use a date such as 2026-03-01')
          return yield* withHistory(state, (h) =>
            Effect.succeed(graphAsOf(state.repo, h, { asOf, now: new Date().toISOString() })),
          )
        }
        const fresh = yield* state.freshness.get
        return graphOf(state.repo, fresh)
      }),
    ),
  )

const goals = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'goals', (handlers) =>
    handlers
      .handle('list', () => Effect.sync(() => ({ goals: goalRows(state.repo) })))
      .handle('get', ({ params }) =>
        Effect.gen(function* () {
          const item = yield* locate(state, params.id)
          if (item.type !== 'goal') {
            return yield* new NotFound({ message: `${params.id} is not a goal`, id: params.id })
          }
          return goalDetail(state.repo, item)
        }),
      ),
  )

const projects = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'projects', (handlers) =>
    handlers
      .handle('list', () => Effect.sync(() => ({ projects: projectRows(state.repo) })))
      .handle('board', ({ params }) =>
        Effect.gen(function* () {
          const item = yield* locate(state, params.id)
          if (item.type !== 'project') {
            return yield* new NotFound({ message: `${params.id} is not a project`, id: params.id })
          }
          return boardOf(state.repo, item)
        }),
      ),
  )

const knowledge = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'knowledge', (handlers) =>
    handlers
      .handle('list', () =>
        Effect.gen(function* () {
          const fresh = yield* state.freshness.get
          return { items: knowledgeRows(state.repo, fresh) }
        }),
      )
      .handle('preview', ({ params }) =>
        Effect.gen(function* () {
          const item = yield* locate(state, params.id)
          const detail = itemDetail(state.repo, item, undefined)
          const git = state.git
          const changed =
            git === undefined
              ? null
              : yield* coChanged(git, state.repo.workspace.root, item.path, {
                  contentRoot: state.repo.workspace.config.content,
                  minCommits: 1,
                }).pipe(Effect.mapError(gitFailure))
          return {
            id: params.id,
            summary: summaryOf(detail.body),
            backlinks: detail.backlinks,
            coChanged: changed,
          }
        }),
      )
      .handle('view', ({ params }) =>
        Effect.gen(function* () {
          const item = yield* locate(state, params.id)
          return yield* knowledgeView(state, item)
        }),
      ),
  )

const knowledgeView = (state: ServerState, item: ScannedItem) =>
  Effect.gen(function* () {
    const fields = fieldsOf(item)
    const chain = item.type === 'adr' ? supersessionChain(state.repo, item) : []

    const fresh = (yield* state.freshness.get)?.get(item.path)
    const git = state.git
    const changes =
      git === undefined || fresh === undefined || fresh.covers.length === 0
        ? null
        : yield* Effect.gen(function* () {
            const map = yield* pathMap(git, state.repo.workspace.root)
            const commits = yield* git.log({
              paths: fresh.covers.map((c) => map.toGit(c)),
              ...(fresh.baseline ? { after: fresh.baseline.date } : {}),
              limit: 30,
            })
            return {
              since: fresh.baseline?.date ?? null,
              covers: [...fresh.covers],
              commits: commits.map((c) => ({
                hash: c.hash,
                subject: c.subject,
                date: c.committerDate,
                author: c.author.name,
              })),
            }
          }).pipe(Effect.mapError(gitFailure))

    const context =
      item.type !== 'context'
        ? null
        : yield* Effect.gen(function* () {
            const report = yield* syncContext(state.repo, { check: true })
            return {
              include: fields.include_in_context === true,
              targets: report.targets.map((t) => {
                const mine = (list: ReadonlyArray<{ id: string; tokens: number }>) =>
                  list.find((i) => i.id === item.id)
                const inBlock = mine(t.included)
                const left = mine(t.omitted)
                return {
                  target: t.target,
                  path: t.path,
                  included: inBlock !== undefined,
                  omitted: left !== undefined,
                  tokens: (inBlock ?? left)?.tokens ?? 0,
                  budget: t.budget,
                  stale: t.stale,
                }
              }),
            }
          }).pipe(Effect.mapError(gitFailure))

    return { id: item.id as string, chain, changes, context }
  })

const tags = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'tags', (handlers) =>
    handlers
      .handle('list', () => Effect.sync(() => ({ tags: tagUsage(state.repo) })))
      .handle('map', () => Effect.sync(() => tagMap(state.repo)))
      .handle('rename', ({ payload }) =>
        state.writes.withPermits(1)(
          renameTag(state.repo, payload).pipe(
            Effect.mapError(toApiError),
            Effect.tap((r) => notifyChanged(state, r.changed, [])),
          ),
        ),
      ),
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

const lintTextGroup = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'lintText', (handlers) =>
    handlers.handle('lintText', ({ payload }) =>
      Effect.gen(function* () {
        const item = yield* locate(state, payload.id)
        const freshness = yield* state.freshness.get
        const diagnostics = lintText(state.repo, item.path, payload.text, { freshness })
        return { summary: summarize(diagnostics), diagnostics }
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
    handlers
      .handle('inbox', ({ query }) =>
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

          const since = new Date(Date.now() - 14 * 86_400_000).toISOString()
          const recent = state.git
            ? yield* state.git.log({ after: since, limit: 50 }).pipe(Effect.orElseSucceed(() => []))
            : []
          const patches = state.git
            ? yield* state.git
                .patchLog({ paths: ['.'], after: since, limit: 30, context: 0 })
                .pipe(Effect.orElseSucceed(() => []))
            : []
          const todo = /\bTODO\b/
          const todos = patches.flatMap((c) =>
            c.patches
              .filter((p) => !p.deleted && !p.path.startsWith(`${folder}/`))
              .flatMap((p) =>
                p.hunks.flatMap((h) =>
                  h.lines.flatMap((text, i) =>
                    todo.test(text)
                      ? [{ hash: c.hash, date: c.date, path: p.path, line: h.newStart + i, text }]
                      : [],
                  ),
                ),
              ),
          )

          const captures = yield* readCaptures(repo).pipe(Effect.mapError(gitFailure))

          return {
            captures,
            raised: raised(repo, {
              freshness: fresh ?? new Map(),
              commits: recent,
              todos,
            }),
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
      )
      .handle('capture', ({ payload }) =>
        state.writes.withPermits(1)(
          addCapture(state.repo, payload.text).pipe(
            Effect.mapError(toApiError),
            Effect.tap(() => notifyChanged(state, [], [])),
          ),
        ),
      )
      .handle('release', ({ query }) =>
        state.writes.withPermits(1)(
          removeCapture(state.repo, query.text).pipe(
            Effect.mapError(toApiError),
            Effect.tap(() => notifyChanged(state, [], [])),
            Effect.map((removed) => ({ removed })),
          ),
        ),
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

const timeline = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'timeline', (handlers) =>
    handlers.handle('timeline', ({ query }) =>
      withHistory(state, (h) => {
        const date = /^\d{4}-\d{2}-\d{2}$/
        for (const key of ['from', 'to'] as const) {
          const v = query[key]
          if (v !== undefined && !date.test(v))
            return Effect.fail(invalid([key], 'Must be a date like 2026-03-05'))
        }
        return Effect.succeed(
          timelineOf(state.repo, h, {
            ...(query.from ? { from: query.from } : {}),
            ...(query.to ? { to: query.to } : {}),
            now: new Date().toISOString(),
          }),
        )
      }),
    ),
  )

const stats = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'stats', (handlers) =>
    handlers
      .handle('period', ({ query }) =>
        Effect.gen(function* () {
          const period = query.period ?? '30d'
          if (period !== '30d' && period !== 'quarter' && period !== 'year')
            return yield* invalid(['period'], 'Use 30d, quarter or year')
          const fresh = yield* state.freshness.get
          return yield* withHistory(state, (h) =>
            Effect.succeed(
              periodStats(state.repo, h, {
                period,
                now: new Date().toISOString(),
                ...(query.area === undefined || query.area === '' ? {} : { area: query.area }),
                ...(fresh === undefined ? {} : { freshness: fresh }),
              }),
            ),
          )
        }),
      )
      .handle('stats', ({ query }) =>
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

const events = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'events', (handlers) =>
    handlers.handle('events', () =>
      // Subscribe before saying `ready`, so nothing published after the client sees it is lost.
      Effect.succeed(
        Stream.unwrap(
          Effect.gen(function* () {
            const subscription = yield* PubSub.subscribe(state.events)
            const ping = Stream.tick('25 seconds').pipe(
              Stream.drop(1),
              Stream.map(() => ({ type: 'ping' as const })),
            )
            return Stream.make({ type: 'ready' as const, version: state.version }).pipe(
              Stream.concat(Stream.merge(Stream.fromSubscription(subscription), ping)),
            )
          }),
        ),
      ),
    ),
  )

const meta = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'meta', (handlers) =>
    handlers
      .handle('health', () =>
        Effect.gen(function* () {
          const status = state.git
            ? yield* state.git.status().pipe(Effect.orElseSucceed(() => undefined))
            : undefined
          const identity = state.git
            ? yield* state.git.identity.pipe(Effect.orElseSucceed(() => undefined))
            : undefined
          const user = identity ? handleFrom(identity) : undefined
          return {
            name: 'netherite' as const,
            version: state.version,
            root: state.repo.workspace.root,
            items: state.repo.index.size(),
            git: state.git !== undefined,
            ...(status?.branch ? { branch: status.branch } : {}),
            ...(user ? { user } : {}),
          }
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
    goals(state),
    projects(state),
    knowledge(state),
    tags(state),
    lintGroup(state),
    lintTextGroup(state),
    inbox(state),
    history(state),
    stats(state),
    timeline(state),
    events(state),
    meta(state),
  )

/** The whole API as a layer: add it to an `HttpRouter` and serve it. */
export const apiLayer = (state: ServerState) =>
  HttpApiBuilder.layer(NetheriteApi, { openapiPath: '/api/openapi.json' }).pipe(
    Layer.provide(handlersLayer(state)),
  )
