/** A small valid workspace (goal, project, tasks, ADRs, doc) that lints with no errors. */
const front = (lines: string[]) => `---\n${lines.join('\n')}\n---\n`

/** A small valid workspace, rooted at /repo, with no lint errors. */
export const cleanWorkspaceFiles = (root = '/repo'): Record<string, string> => ({
  [`${root}/.netherite/config.yml`]: 'version: 1\n',
  [`${root}/netherite/goals/GOAL-00001-ship.md`]: `${front([
    'id: GOAL-00001',
    'aliases: [GOAL-00001]',
    'type: goal',
    'title: Ship',
    'status: active',
  ])}\n# Ship\n\nSee [[PRJ-00001]].\n`,
  [`${root}/netherite/projects/PRJ-00001-app.md`]: `${front([
    'id: PRJ-00001',
    'aliases: [PRJ-00001]',
    'type: project',
    'title: App',
    'goals: [GOAL-00001]',
    'status: active',
    'decisions: [ADR-00002]',
  ])}\n# App\n\nDocs in [[DOC-00001]]. Decision [[ADR-00002]].\n`,
  [`${root}/netherite/tasks/TASK-00001-core.md`]: `${front([
    'id: TASK-00001',
    'aliases: [TASK-00001]',
    'type: task',
    'title: Core',
    'project: PRJ-00001',
    'state: backlog',
    'labels: [backend]',
  ])}\n# Core\n\n- [ ] first\n- [x] second\n- [ ] third\n\n## Notes\n\nPlain notes.\n`,
  [`${root}/netherite/tasks/TASK-00002-cli.md`]:
    front([
      'id: TASK-00002',
      'aliases: [TASK-00002]',
      'type: task',
      'title: CLI',
      'project: PRJ-00001',
      'state: doing',
      'depends_on: [TASK-00001]',
      'decisions: [ADR-00002]',
    ]) +
    '\n# CLI\n\nBuilds on [[TASK-00001]] and [[TASK-00001|the core]]; see [[TASK-00001#Notes]].\n',
  [`${root}/netherite/adr/ADR-00001-callbacks.md`]: `${front([
    'id: ADR-00001',
    'aliases: [ADR-00001]',
    'type: adr',
    'title: Callbacks',
    'status: accepted',
    'date: 2026-01-01',
  ])}\n# Callbacks\n\nOlder than [[ADR-00002]].\n`,
  [`${root}/netherite/adr/ADR-00002-promises.md`]: `${front([
    'id: ADR-00002',
    'aliases: [ADR-00002]',
    'type: adr',
    'title: Promises',
    'status: accepted',
    'date: 2026-01-02',
  ])}\n# Promises\n\n## Context\n\nText.\n\n## Decision\n\nUse promises.\n`,
  [`${root}/netherite/adr/ADR-00003-logging.md`]: `${front([
    'id: ADR-00003',
    'aliases: [ADR-00003]',
    'type: adr',
    'title: Logging',
    'status: proposed',
    'date: 2026-01-03',
  ])}\n# Logging\n\nSee [[DOC-00001]].\n`,
  [`${root}/netherite/docs/DOC-00001-overview.md`]: `${front([
    'id: DOC-00001',
    'aliases: [DOC-00001]',
    'type: doc',
    'title: Overview',
    'explains: [PRJ-00001]',
    'covers: ["src/**"]',
    'reviewed_at: 2026-01-01',
  ])}\n# Overview\n\nSee [[ADR-00001]] and [[ADR-00003]].\n`,
})
