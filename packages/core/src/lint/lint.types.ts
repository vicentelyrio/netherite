import type { Config } from '@netherite/schema'
import type { Freshness } from '../freshness'

export type Severity = 'error' | 'warning' | 'info'

export type RuleId =
  | 'frontmatter'
  | 'schema'
  | 'duplicate-id'
  | 'missing-alias'
  | 'file-name-id'
  | 'outside-type-folder'
  | 'broken-link'
  | 'ambiguous-link'
  | 'broken-heading'
  | 'drifting'
  | 'stale'
  | 'orphan'
  | 'superseded-without-successor'
  | 'links-to-retired'
  | 'unknown-field'
  | 'template-unknown-field'
  | 'source-missing'
  | 'due-before-created'
  | 'milestone-without-due'
  | 'invalid-horizon'

export type Fix =
  | { readonly kind: 'add-alias'; readonly path: string; readonly alias: string }
  | { readonly kind: 'rename-file'; readonly path: string; readonly to: string }

export interface Diagnostic {
  readonly path: string
  readonly line: number
  readonly column: number
  readonly rule: RuleId
  readonly severity: Severity
  readonly message: string
  readonly fix?: Fix
}

export interface LintOptions {
  readonly config: Pick<Config, 'states'>
  readonly contentRoot: string
  readonly only?: ReadonlyArray<string>
  readonly freshness?: ReadonlyMap<string, Freshness>
  readonly freshnessSeverity?: { readonly drifting?: Severity; readonly stale?: Severity }
}

export type Position = { line: number; column: number }

export interface LintSummary {
  readonly error: number
  readonly warning: number
  readonly info: number
}
