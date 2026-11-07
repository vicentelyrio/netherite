import { Severity } from '@netherite/schema'
import type { Diagnostic, LintSummary } from './lint.types'

export const summarize = (diagnostics: ReadonlyArray<Diagnostic>): LintSummary => ({
  error: diagnostics.filter((d) => d.severity === Severity.Error).length,
  warning: diagnostics.filter((d) => d.severity === Severity.Warning).length,
  info: diagnostics.filter((d) => d.severity === Severity.Info).length,
})
