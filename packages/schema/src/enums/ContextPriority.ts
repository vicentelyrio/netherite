export const ContextPriority = {
  High: 'high',
  Normal: 'normal',
  Low: 'low',
} as const

export type ContextPriority = (typeof ContextPriority)[keyof typeof ContextPriority]
