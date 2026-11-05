import { Effect } from 'effect'
import { computeFreshness, type Freshness } from './freshness'
import type { GitRepository } from './git-access'
import type { Repo } from './ops/repo'

export interface FreshnessCache {
  /** Freshness of every tracked item by path, or `undefined` when there is no git or it failed. */
  readonly get: Effect.Effect<
    ReadonlyMap<string, Freshness> | undefined,
    never,
    import('effect').FileSystem.FileSystem | import('effect').Path.Path
  >
  /** Something changed (a write, or files changed outside), so the next `get` recomputes. */
  readonly invalidate: () => void
}

/**
 * Freshness covers the whole index, so it is computed on demand and kept until something changes.
 * Servers hold one per repository and call `invalidate` after every write and watcher event.
 */
export const freshnessCache = (repo: Repo, git: GitRepository | undefined): FreshnessCache => {
  let generation = 0
  let cached: { generation: number; map: ReadonlyMap<string, Freshness> } | undefined
  git?.invalidate()
  return {
    get: Effect.gen(function* () {
      if (git === undefined) return undefined
      if (cached?.generation === generation) return cached.map
      const at = generation
      const map = yield* computeFreshness({
        index: repo.index,
        git,
        thresholds: repo.workspace.config.freshness,
        root: repo.workspace.root,
      }).pipe(Effect.orElseSucceed(() => undefined))
      if (map === undefined) return undefined
      cached = { generation: at, map }
      return map
    }),
    invalidate: () => {
      generation++
      git?.invalidate()
    },
  }
}
