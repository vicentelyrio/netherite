import type { ServerEvent } from '@netherite/api'
import {
  freshnessCache,
  type History,
  type Repo,
  readHistory,
  withWorkingTree,
} from '@netherite/core'
import { Effect, PubSub, Semaphore } from 'effect'
import { newToken } from '../security'
import type { ServerOptions, ServerState } from './state.types'

const unknownVersion = '0.0.0'
const oneWriteAtATime = 1

export const makeState = (repo: Repo, options: ServerOptions = {}) =>
  Effect.gen(function* () {
    const freshness = freshnessCache(repo, options.git)
    const writes = yield* Semaphore.make(oneWriteAtATime)
    const events = yield* PubSub.unbounded<ServerEvent>()
    let cached: { head: string | undefined; history: History } | undefined

    const history: ServerState['history'] = Effect.gen(function* () {
      const git = options.git
      if (git === undefined) return undefined
      const head = yield* git.head
      if (cached !== undefined && cached.head === head) {
        return withWorkingTree(cached.history, repo.index, new Date().toISOString())
      }
      const read = yield* readHistory(git, repo.workspace.root, {
        contentRoot: repo.contentRoot,
      })
      cached = { head, history: read }
      return withWorkingTree(read, repo.index, new Date().toISOString())
    })

    return {
      repo,
      git: options.git,
      createdBy: options.createdBy,
      version: options.version ?? unknownVersion,
      token: options.token ?? newToken(),
      origins: options.origins ?? [],
      freshness,
      writes,
      events,
      publish: (event) => PubSub.publish(events, event).pipe(Effect.asVoid),
      history,
      invalidate: () => {
        freshness.invalidate()
        cached = undefined
      },
    } satisfies ServerState
  })
