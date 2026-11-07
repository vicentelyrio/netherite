export const Severity = {
  Error: 'error',
  Warning: 'warning',
  Info: 'info',
} as const

export type Severity = (typeof Severity)[keyof typeof Severity]
