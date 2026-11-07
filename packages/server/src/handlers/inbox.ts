import { NetheriteApi } from '@netherite/api'
import {
  AdrStatus,
  addCapture,
  fieldsOf,
  groupActivity,
  ItemType,
  itemSummary,
  raised,
  readActivity,
  readCaptures,
  removeCapture,
  type ScannedItem,
  StateCategoryName,
} from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { toApiError } from '../errors'
import type { ServerState } from '../state'
import { gitFailure, invalid } from './failures'
import { lintReport } from './lint'
import { notifyChanged } from './write'

const gitChange = (e: { kind: string; index: string; worktree: string }) => {
  if (e.kind === 'untracked') return 'untracked'
  if (e.kind === 'renamed') return 'renamed'
  const letters = `${e.index}${e.worktree}`
  if (letters.includes('D')) return 'deleted'
  if (letters.includes('A')) return 'added'
  return 'modified'
}

export const inbox = (state: ServerState) =>
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
            states.filter((s) => s.category === StateCategoryName.Blocked).map((s) => s.name),
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
              all.filter(
                (i) => i.type === ItemType.Adr && fieldsOf(i).status === AdrStatus.Proposed,
              ),
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
                (i) =>
                  i.type === ItemType.Task && blockedStates.has(String(fieldsOf(i).state ?? '')),
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
