import { Schema } from 'effect'
import { N, opt, S } from './common'

export const Severity = Schema.Literals(['error', 'warning', 'info'])

export const Diagnostic = Schema.Struct({
  path: S,
  line: N,
  column: N,
  rule: S,
  severity: Severity,
  message: S,
})

export const LintReport = Schema.Struct({
  summary: Schema.Struct({ error: N, warning: N, info: N }),
  diagnostics: Schema.Array(Diagnostic),
})

export const LintQuery = { id: opt(S) }
