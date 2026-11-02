import { EmptyState, UiPreview } from '@netherite/ui'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  type RouterHistory,
  redirect,
} from '@tanstack/react-router'
import { DecisionsPage } from './pages/decisions'
import { GoalPage, GoalsPage } from './pages/goals'
import { GraphPage } from './pages/graph'
import { ItemPage } from './pages/item'
import { KnowledgePage } from './pages/knowledge'
import { type PageProps, Placeholder } from './pages/lists'
import { BoardPage } from './pages/projects'
import { ProjectsEntry } from './pages/projects-entry'
import { Shell } from './shell'

const root = createRootRoute({
  component: Shell,
  notFoundComponent: () => (
    <EmptyState icon="search_off" title="Nothing here" description="That page does not exist." />
  ),
})

const index = createRoute({
  getParentRoute: () => root,
  path: '/',
  beforeLoad: () => {
    // The tree is typed after this route, so the target cannot be checked here.
    throw redirect({ to: '/goals' } as never)
  },
})

const screen = (path: string, props: PageProps) =>
  createRoute({ getParentRoute: () => root, path, component: () => <Placeholder {...props} /> })

const inbox = screen('/inbox', {
  title: 'Inbox',
  icon: 'inbox',
  arrives:
    'What agents changed, ADRs waiting for a decision, stale docs, orphans, lint errors and blocked tasks (TASK-00045).',
})
const goals = createRoute({ getParentRoute: () => root, path: '/goals', component: GoalsPage })
const goal = createRoute({
  getParentRoute: () => root,
  path: '/goals/$id',
  component: function GoalRoute() {
    const { id } = goal.useParams()
    return <GoalPage id={id} />
  },
})
const projects = createRoute({
  getParentRoute: () => root,
  path: '/projects',
  component: ProjectsEntry,
})
const project = createRoute({
  getParentRoute: () => root,
  path: '/projects/$id',
  validateSearch: (search: Record<string, unknown>): { task?: string; mode?: 'split' } => ({
    ...(typeof search.task === 'string' && search.task !== '' ? { task: search.task } : {}),
    ...(search.mode === 'split' ? { mode: 'split' as const } : {}),
  }),
  component: function ProjectRoute() {
    const { id } = project.useParams()
    const { task, mode } = project.useSearch()
    return <BoardPage id={id} task={task} {...(mode ? { mode } : {})} />
  },
})
const knowledge = createRoute({
  getParentRoute: () => root,
  path: '/knowledge',
  component: KnowledgePage,
})
const decisions = createRoute({
  getParentRoute: () => root,
  path: '/decisions',
  component: DecisionsPage,
})
const stats = screen('/stats', {
  title: 'Stats',
  icon: 'bar_chart',
  arrives: 'Progress per goal and project over time, and tasks done per week (TASK-00046).',
})
const tags = screen('/tags', {
  title: 'Tags',
  icon: 'sell',
  arrives: 'Every label and tag, with counts, and renaming across files (TASK-00047).',
})
const graph = createRoute({
  getParentRoute: () => root,
  path: '/graph',
  validateSearch: (search: Record<string, unknown>): { focus?: string } =>
    typeof search.focus === 'string' && search.focus !== '' ? { focus: search.focus } : {},
  component: function GraphRoute() {
    const { focus } = graph.useSearch()
    return <GraphPage focus={focus} />
  },
})

const item = createRoute({
  getParentRoute: () => root,
  path: '/items/$id',
  validateSearch: (search: Record<string, unknown>): { mode?: 'split' } =>
    search.mode === 'split' ? { mode: 'split' } : {},
  component: function ItemRoute() {
    const { id } = item.useParams()
    const { mode } = item.useSearch()
    return <ItemPage id={id} {...(mode ? { mode } : {})} />
  },
})

const preview = createRoute({ getParentRoute: () => root, path: '/dev/ui', component: UiPreview })

const routeTree = root.addChildren([
  index,
  inbox,
  goals,
  goal,
  projects,
  project,
  knowledge,
  decisions,
  stats,
  tags,
  graph,
  item,
  preview,
])

/** The app's routes. Pass a memory history for tests. */
export const createAppRouter = (history?: RouterHistory) =>
  createRouter({ routeTree, ...(history ? { history } : {}), defaultPreload: 'intent' })

export type AppRouter = ReturnType<typeof createAppRouter>
export { createMemoryHistory }

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}
