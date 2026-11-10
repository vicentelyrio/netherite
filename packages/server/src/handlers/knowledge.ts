import { NetheriteApi } from '@netherite/api'
import {
  coChanged,
  fieldsOf,
  ItemType,
  itemDetail,
  knowledgeRows,
  pathMap,
  type ScannedItem,
  summaryOf,
  supersessionChain,
  syncContext,
} from '@netherite/core'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import type { ServerState } from '../state'
import { gitFailure } from './failures'
import { locate } from './locate'

const provenanceOf = (frontmatter: unknown) => {
  const data = (
    typeof frontmatter === 'object' && frontmatter !== null ? frontmatter : {}
  ) as Record<string, unknown>
  return {
    ...(typeof data.source === 'string' && data.source !== '' ? { source: data.source } : {}),
    ...(typeof data.imported_at === 'string' ? { importedAt: data.imported_at } : {}),
  }
}

export const knowledge = (state: ServerState) =>
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
          const latest =
            git === undefined
              ? undefined
              : (yield* git
                  .log({ paths: [item.path], limit: 1 })
                  .pipe(Effect.orElseSucceed(() => [])))[0]
          return {
            id: params.id,
            summary: summaryOf(detail.body),
            backlinks: detail.backlinks,
            coChanged: changed,
            ...provenanceOf(detail.frontmatter),
            ...(latest === undefined
              ? {}
              : {
                  lastCommit: {
                    hash: latest.hash,
                    subject: latest.subject,
                    date: latest.date,
                    author: latest.author.name,
                  },
                }),
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
    const chain = item.type === ItemType.Adr ? supersessionChain(state.repo, item) : []

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
              uncommitted: [...fresh.uncommittedFiles],
              commits: commits.map((c) => ({
                hash: c.hash,
                subject: c.subject,
                date: c.committerDate,
                author: c.author.name,
              })),
            }
          }).pipe(Effect.mapError(gitFailure))

    const context =
      item.type !== ItemType.Context
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
