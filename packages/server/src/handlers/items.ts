import { NetheriteApi } from '@netherite/api'
import {
  checkTargetOf,
  createItem,
  deleteItem,
  itemDetail,
  link,
  listItems,
  markReviewed,
  pathMap,
  readSource,
  replaceSource,
  setState,
  settingDefaults,
  starterBody,
  toggleChecklistItem,
  unlink,
  updateItem,
} from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { toApiError } from '../errors'
import type { ServerState } from '../state'
import { gitFailure, invalid } from './failures'
import { locate } from './locate'
import { notifyChanged, write } from './write'

export const items = (state: ServerState) =>
  HttpApiBuilder.group(NetheriteApi, 'items', (handlers) => {
    const w = write(state)
    return handlers
      .handle('list', ({ query }) => {
        const limit = query.limit ?? settingDefaults.queries.listLimit
        const offset = query.offset ?? 0
        if (!Number.isInteger(limit) || limit < 1 || limit > settingDefaults.queries.listMaxLimit)
          return Effect.fail(
            invalid(
              ['limit'],
              `Must be a whole number from 1 to ${settingDefaults.queries.listMaxLimit}`,
            ),
          )
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
          Effect.gen(function* () {
            const body =
              payload.body ??
              (payload.template === true
                ? yield* starterBody(state.repo.workspace, payload.type, payload.title)
                : undefined)
            return yield* createItem(state.repo, {
              type: payload.type,
              title: payload.title,
              ...(payload.id === undefined ? {} : { id: payload.id }),
              ...(payload.fields === undefined ? {} : { fields: payload.fields as never }),
              ...(body === undefined ? {} : { body }),
              ...((payload.createdBy ?? state.createdBy) === undefined
                ? {}
                : { createdBy: (payload.createdBy ?? state.createdBy) as string }),
            })
          }),
        ),
      )
      .handle('source', ({ params }) =>
        Effect.gen(function* () {
          yield* locate(state, params.id)
          const source = yield* readSource(state.repo, params.id).pipe(Effect.mapError(gitFailure))
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
        const ask = checkTargetOf(payload)
        if ('problem' in ask) return Effect.fail(invalid(['item'], ask.problem))
        return w(
          toggleChecklistItem(
            state.repo,
            params.id,
            ask.target,
            ask.checked,
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
