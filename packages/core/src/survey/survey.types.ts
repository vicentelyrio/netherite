import type { GitRepository } from '@netherite/git'

export type SurveyType = 'doc' | 'runbook' | 'context' | 'adr'

export interface SurveyEntry {
  readonly source: string
  readonly type: SurveyType
  readonly id?: string
  readonly fields?: Readonly<Record<string, string>>
}

export type SkipReason =
  | 'already-imported'
  | 'nested-agent-file'
  | 'stub'
  | 'managed-by-a-tool'
  | 'not-documentation'
  | 'template'
  | 'test-data'
  | 'decision-index'
  | 'maybe-a-secret'
  | 'too-large'

export interface SkippedGroup {
  readonly reason: SkipReason
  readonly label: string
  readonly count: number
  readonly examples: ReadonlyArray<string>
}

export interface Survey {
  readonly scanned: number
  readonly entries: ReadonlyArray<SurveyEntry>
  readonly skipped: ReadonlyArray<SkippedGroup>
  readonly notes: ReadonlyArray<string>
}

export interface SurveyOptions {
  readonly git?: GitRepository | undefined
  readonly nestedAgentFiles?: boolean | undefined
}
