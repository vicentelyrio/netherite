/** The folder each item type lives in under the content root (ADR-00002). */
export const typeFolders = {
  goal: 'goals',
  project: 'projects',
  task: 'tasks',
  adr: 'adr',
  doc: 'docs',
  context: 'context',
  runbook: 'runbooks',
} as const
