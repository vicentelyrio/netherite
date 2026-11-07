import type { ItemTypeName } from '@netherite/tokens'

export const typeLabels: Readonly<Record<ItemTypeName, string>> = {
  goal: 'Goal',
  project: 'Project',
  task: 'Task',
  adr: 'ADR',
  doc: 'Doc',
  context: 'Context',
  runbook: 'Runbook',
}
