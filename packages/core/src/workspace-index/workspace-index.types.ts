import type { LinkInfo } from '@netherite/markdown'
import type { Config } from '@netherite/schema'
import type { MultiDirectedGraph } from 'graphology'
import type { Resolution } from '../resolve'
import type { ScannedItem } from '../scanned-item'
import type { createIndex } from './createIndex'

export type EdgeKind =
  | 'belongs_to'
  | 'implements'
  | 'explains'
  | 'supersedes'
  | 'depends_on'
  | 'related'
  | 'reference'

export interface Ref {
  readonly kind: EdgeKind
  readonly target: string
  readonly heading?: string
  readonly direction: 'out' | 'in'
  readonly field: string
  readonly position?: LinkInfo['position']
}

export interface ResolvedRef {
  readonly ref: Ref
  readonly resolution: Resolution
}

export interface Edge {
  readonly kind: EdgeKind
  readonly from: string
  readonly to: string
}

export interface Progress {
  readonly done: number
  readonly total: number
}

export interface SearchHit {
  readonly path: string
  readonly id: string | undefined
  readonly title: string | undefined
  readonly type: string | undefined
  readonly score: number
}

export interface SearchOptions {
  readonly types?: ReadonlyArray<string>
  readonly limit?: number
}

export interface IndexChange {
  readonly changed: ReadonlyArray<string>
}

export interface Entry {
  item: ScannedItem
  refs: Ref[]
  resolved: ResolvedRef[]
  owned: Set<string>
}

export interface NodeAttributes {
  id?: string
  type?: string
  title?: string
}

export interface EdgeAttributes {
  kind: EdgeKind
}

export type IndexGraph = MultiDirectedGraph<NodeAttributes, EdgeAttributes, Record<string, never>>

export interface IndexOptions {
  readonly config: Pick<Config, 'states'>
}

export type WorkspaceIndex = ReturnType<typeof createIndex>
