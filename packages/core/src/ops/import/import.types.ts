import type { FieldIssue } from '@netherite/schema'
import type { Json } from '../../edit'

export const importTypes = ['doc', 'runbook', 'context', 'adr'] as const

export type ImportType = (typeof importTypes)[number]

export interface ImportEntry {
  readonly source: string
  readonly type: ImportType
  readonly title?: string
  readonly id?: string
  readonly fields?: Readonly<Record<string, Json>>
  readonly body?: string
  readonly mode: 'copy' | 'move'
}

export interface ImportOptions {
  readonly update?: boolean
  readonly dryRun?: boolean
  readonly stub?: boolean
  readonly createdBy?: string
  readonly mode?: 'copy' | 'move'
}

export type EntryStatus = 'created' | 'updated' | 'skipped' | 'failed'

export interface EntryResult {
  readonly entry: number
  readonly source: string | undefined
  readonly status: EntryStatus
  readonly id?: string
  readonly path?: string
  readonly reason?: string
  readonly issues?: ReadonlyArray<FieldIssue>
  readonly original?: 'removed' | 'stub' | 'kept'
}

export interface ImportReport {
  readonly dryRun: boolean
  readonly results: ReadonlyArray<EntryResult>
  readonly counts: Readonly<Record<EntryStatus, number>>
  readonly relinked: { readonly items: number; readonly links: number }
}

export type Parsed = { readonly entry: ImportEntry } | { readonly problem: string }
