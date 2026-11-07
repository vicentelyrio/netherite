export const StateCategoryName = {
  Todo: 'todo',
  Active: 'active',
  Blocked: 'blocked',
  Done: 'done',
} as const

export type StateCategoryName = (typeof StateCategoryName)[keyof typeof StateCategoryName]
