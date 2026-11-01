import { fixedClock, type MemoryFileSystemOptions, memoryFileSystem } from '@netherite/testing'
import { Clock, Effect, Layer, Path } from 'effect'
import { openRepo, type Repo } from '../src/index'

const front = (lines: string[]) => `---\n${lines.join('\n')}\n---\n`

/** A small valid workspace, rooted at /repo, with no lint errors. */
export const cleanFiles = (): Record<string, string> => ({
  '/repo/.netherite/config.yml': 'version: 1\n',
  '/repo/netherite/goals/GOAL-00001-ship.md': `${front([
    'id: GOAL-00001',
    'aliases: [GOAL-00001]',
    'type: goal',
    'title: Ship',
    'status: active',
  ])}\n# Ship\n\nSee [[PRJ-00001]].\n`,
  '/repo/netherite/projects/PRJ-00001-app.md': `${front([
    'id: PRJ-00001',
    'aliases: [PRJ-00001]',
    'type: project',
    'title: App',
    'goals: [GOAL-00001]',
    'status: active',
    'decisions: [ADR-00002]',
  ])}\n# App\n\nDocs in [[DOC-00001]]. Decision [[ADR-00002]].\n`,
  '/repo/netherite/tasks/TASK-00001-core.md': `${front([
    'id: TASK-00001',
    'aliases: [TASK-00001]',
    'type: task',
    'title: Core',
    'project: PRJ-00001',
    'state: backlog',
    'labels: [backend]',
  ])}\n# Core\n\n- [ ] first\n- [x] second\n- [ ] third\n\n## Notes\n\nPlain notes.\n`,
  '/repo/netherite/tasks/TASK-00002-cli.md':
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
  '/repo/netherite/adr/ADR-00001-callbacks.md': `${front([
    'id: ADR-00001',
    'aliases: [ADR-00001]',
    'type: adr',
    'title: Callbacks',
    'status: accepted',
    'date: 2026-01-01',
  ])}\n# Callbacks\n\nOlder than [[ADR-00002]].\n`,
  '/repo/netherite/adr/ADR-00002-promises.md': `${front([
    'id: ADR-00002',
    'aliases: [ADR-00002]',
    'type: adr',
    'title: Promises',
    'status: accepted',
    'date: 2026-01-02',
  ])}\n# Promises\n\n## Context\n\nText.\n\n## Decision\n\nUse promises.\n`,
  '/repo/netherite/adr/ADR-00003-logging.md': `${front([
    'id: ADR-00003',
    'aliases: [ADR-00003]',
    'type: adr',
    'title: Logging',
    'status: proposed',
    'date: 2026-01-03',
  ])}\n# Logging\n\nSee [[DOC-00001]].\n`,
  '/repo/netherite/docs/DOC-00001-overview.md': `${front([
    'id: DOC-00001',
    'aliases: [DOC-00001]',
    'type: doc',
    'title: Overview',
    'explains: [PRJ-00001]',
    'covers: ["src/**"]',
    'reviewed_at: 2026-01-01',
  ])}\n# Overview\n\nSee [[ADR-00001]] and [[ADR-00003]].\n`,
})

export interface World {
  readonly repo: Repo
  readonly files: () => Record<string, string>
  readonly read: (path: string) => string | undefined
  readonly layer: Layer.Layer<never>
  /** Changes files behind the repo's back, as another program would. */
  readonly write: (path: string, content: string) => void
  readonly remove: (path: string) => void
  /** Runs an operation against the in-memory files, at a fixed time. */
  readonly run: <A, E>(
    effect: Effect.Effect<A, E, never | import('effect').FileSystem.FileSystem | Path.Path>,
  ) => Promise<A>
  readonly fail: <A, E>(
    effect: Effect.Effect<A, E, import('effect').FileSystem.FileSystem | Path.Path>,
  ) => Promise<E>
}

export const now = '2026-03-05T10:30:00.000Z'

/** Opens a repo over in-memory files. `/repo/...` paths in, workspace-relative paths out. */
export const world = async (
  files: Record<string, string> = cleanFiles(),
  options: MemoryFileSystemOptions = {},
): Promise<World> => {
  const fs = memoryFileSystem(files, options)
  const layer = Layer.merge(fs.layer, Path.layer) as Layer.Layer<never>
  const provide = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    effect.pipe(
      Effect.provideService(Clock.Clock, fixedClock(now)),
      Effect.provide(layer as never),
    ) as Effect.Effect<A, E, never>
  const repo = await Effect.runPromise(provide(openRepo('/repo')))
  return {
    repo,
    files: () => Object.fromEntries(fs.files().map((f) => [f, fs.read(f) as string])),
    read: (path) => fs.read(path.startsWith('/') ? path : `/repo/${path}`),
    layer,
    write: (path, content) => fs.write(path.startsWith('/') ? path : `/repo/${path}`, content),
    remove: (path) => fs.remove(path.startsWith('/') ? path : `/repo/${path}`),
    run: (effect) => Effect.runPromise(provide(effect as never)) as never,
    fail: (effect) => Effect.runPromise(provide(Effect.flip(effect as never))) as never,
  }
}
