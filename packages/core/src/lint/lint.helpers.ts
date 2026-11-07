import type { Position, Severity } from './lint.types'

export const top: Position = { line: 1, column: 1 }

export const severityOrder: Record<Severity, number> = { error: 0, warning: 1, info: 2 }
