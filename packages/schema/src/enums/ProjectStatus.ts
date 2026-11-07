export const ProjectStatus = {
  Active: 'active',
  Paused: 'paused',
  Done: 'done',
  Archived: 'archived',
} as const

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus]
