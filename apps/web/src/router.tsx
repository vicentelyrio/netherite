import { EmptyState, UiPreview } from '@netherite/ui'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  notFound,
  type RouterHistory,
  redirect,
} from '@tanstack/react-router'
import { DocDraft, type KnowledgeType, knowledgeTypes } from '@/features/knowledge'
import { isSettingsTab, type SettingsTab } from '@/features/settings'
import { useI18nContext } from '@/infrastructure/i18n'
import { DecisionsPage } from './pages/decisions'
import { GoalPage, GoalsPage } from './pages/goals'
import { GraphPage } from './pages/graph'
import { InboxPage } from './pages/inbox'
import { ItemPage } from './pages/item'
import { KnowledgePage } from './pages/knowledge'
import { ProjectPage, ProjectsEntryPage } from './pages/projects'
import { SettingsPage } from './pages/settings'
import { ShellPage } from './pages/shell'
import { StatsPage } from './pages/stats'
import { TagsPage } from './pages/tags'
import { TimelinePage } from './pages/timeline'

function NotFoundScreen() {
  const { LL } = useI18nContext()
  return (
    <EmptyState
      icon="search_off"
      title={LL.common.notFound.title()}
      description={LL.common.notFound.text()}
    />
  )
}

const root = createRootRoute({
  component: ShellPage,
  notFoundComponent: NotFoundScreen,
})

const index = createRoute({
  getParentRoute: () => root,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/goals' } as never)
  },
})

const inbox = createRoute({ getParentRoute: () => root, path: '/inbox', component: InboxPage })
const goals = createRoute({
  getParentRoute: () => root,
  path: '/goals',
  validateSearch: (search: Record<string, unknown>): { area?: string } =>
    typeof search.area === 'string' && search.area !== '' ? { area: search.area } : {},
  component: function GoalsRoute() {
    const { area } = goals.useSearch()
    return <GoalsPage {...(area ? { area } : {})} />
  },
})
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
  component: ProjectsEntryPage,
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
    return <ProjectPage id={id} task={task} {...(mode ? { mode } : {})} />
  },
})
const knowledge = createRoute({
  getParentRoute: () => root,
  path: '/knowledge',
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search.q === 'string' && search.q !== '' ? { q: search.q } : {},
  component: function KnowledgeRoute() {
    const { q } = knowledge.useSearch()
    return <KnowledgePage {...(q ? { q } : {})} />
  },
})
const knowledgeNew = createRoute({
  getParentRoute: () => root,
  path: '/knowledge/new/$type',
  validateSearch: (search: Record<string, unknown>): { project?: string } =>
    typeof search.project === 'string' && search.project !== '' ? { project: search.project } : {},
  beforeLoad: ({ params }) => {
    if (!knowledgeTypes.has(params.type)) throw notFound()
  },
  component: function KnowledgeNewRoute() {
    const { type } = knowledgeNew.useParams()
    const { project } = knowledgeNew.useSearch()
    return <DocDraft type={type as KnowledgeType} project={project} />
  },
})
const decisions = createRoute({
  getParentRoute: () => root,
  path: '/decisions',
  component: DecisionsPage,
})
const stats = createRoute({ getParentRoute: () => root, path: '/stats', component: StatsPage })
const timeline = createRoute({
  getParentRoute: () => root,
  path: '/timeline',
  component: TimelinePage,
})
const tags = createRoute({ getParentRoute: () => root, path: '/tags', component: TagsPage })
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
  validateSearch: (search: Record<string, unknown>): { mode?: 'split'; fill?: boolean } => ({
    ...(search.mode === 'split' ? { mode: 'split' as const } : {}),
    ...(search.fill === true ? { fill: true } : {}),
  }),
  component: function ItemRoute() {
    const { id } = item.useParams()
    const { mode, fill } = item.useSearch()
    return <ItemPage id={id} {...(mode ? { mode } : {})} {...(fill ? { fill } : {})} />
  },
})

const settings = createRoute({
  getParentRoute: () => root,
  path: '/settings',
  validateSearch: (search: Record<string, unknown>): { tab?: SettingsTab | undefined } => ({
    tab: isSettingsTab(search.tab) ? search.tab : undefined,
  }),
  component: function SettingsRoute() {
    const { tab } = settings.useSearch()
    return <SettingsPage tab={tab} />
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
  knowledgeNew,
  decisions,
  stats,
  tags,
  timeline,
  graph,
  item,
  settings,
  preview,
])

export const createAppRouter = (history?: RouterHistory) =>
  createRouter({ routeTree, ...(history ? { history } : {}), defaultPreload: 'intent' })

export type AppRouter = ReturnType<typeof createAppRouter>
export { createMemoryHistory }

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}
