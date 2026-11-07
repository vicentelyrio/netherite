export const GoalStatus = {
  Active: 'active',
  Paused: 'paused',
  Achieved: 'achieved',
  Dropped: 'dropped',
} as const

export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus]
