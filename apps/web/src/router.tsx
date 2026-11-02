import { EmptyState, UiPreview } from '@netherite/ui'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  type RouterHistory,
  redirect,
} from '@tanstack/react-router'
import { ItemPage } from './pages/item'
import { type PageProps, Placeholder } from './pages/lists'
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
const goals = screen('/goals', {
  title: 'Goals',
  icon: 'track_changes',
  types: ['goal'],
  arrives: 'Goals grouped by area with progress rings (TASK-00037).',
})
const projects = screen('/projects', {
  title: 'Projects',
  icon: 'task_alt',
  types: ['project'],
  arrives: 'The project board: tasks by state, with drag to change state (TASK-00038).',
})
const knowledge = screen('/knowledge', {
  title: 'Knowledge',
  icon: 'stacks',
  types: ['adr', 'doc', 'context', 'runbook'],
  arrives:
    'The knowledge index with filters, stale and orphan toggles and a preview panel (TASK-00040).',
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
const graph = screen('/graph', {
  title: 'Graph',
  icon: 'hub',
  arrives: 'Typed nodes and edges, hover details and focus (TASK-00043).',
})

const item = createRoute({
  getParentRoute: () => root,
  path: '/items/$id',
  component: function ItemRoute() {
    const { id } = item.useParams()
    return <ItemPage id={id} />
  },
})

const preview = createRoute({ getParentRoute: () => root, path: '/dev/ui', component: UiPreview })

const routeTree = root.addChildren([
  index,
  inbox,
  goals,
  projects,
  knowledge,
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
