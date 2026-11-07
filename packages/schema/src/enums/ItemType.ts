export const ItemType = {
  Goal: 'goal',
  Project: 'project',
  Task: 'task',
  Adr: 'adr',
  Doc: 'doc',
  Context: 'context',
  Runbook: 'runbook',
} as const

export type ItemType = (typeof ItemType)[keyof typeof ItemType]
