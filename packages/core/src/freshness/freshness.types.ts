import type { GitRepository } from '@netherite/git'
import type { Config } from '@netherite/schema'
import type { ScannedItem } from '../scanned-item'
import type { WorkspaceIndex } from '../workspace-index'

export type FreshnessState = 'fresh' | 'drifting' | 'stale' | 'not-tracked' | 'unknown'

export interface Freshness {
  readonly state: FreshnessState
  readonly commits: number
  readonly uncommitted: boolean
  readonly uncommittedFiles: ReadonlyArray<string>
  readonly baseline:
    | { readonly source: 'reviewed_at'; readonly date: string }
    | { readonly source: 'last-commit'; readonly date: string; readonly hash: string }
    | undefined
  readonly atLeast: boolean
  readonly covers: ReadonlyArray<string>
  readonly reason?: 'no-covers' | 'superseded' | 'deprecated' | 'no-git' | 'shallow'
}

export type Thresholds = Pick<Config['freshness'], 'drifting' | 'stale'>

export interface Tracked {
  readonly item: ScannedItem
  readonly covers: ReadonlyArray<string>
  readonly test: (path: string) => boolean
  readonly baseline: Freshness['baseline']
}

export interface FreshnessInput {
  readonly index: WorkspaceIndex
  readonly git: GitRepository | undefined
  readonly thresholds: Thresholds
  readonly root: string
  readonly asOf?: string
}
