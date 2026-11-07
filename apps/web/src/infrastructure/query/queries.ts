import { queryOptions, useQuery } from '@tanstack/react-query'
import type { Api } from '../api'

export const keys = {
  health: ['health'] as const,
  items: (params: object = {}) => ['items', 'list', params] as const,
  item: (id: string) => ['items', 'item', id] as const,
  source: (id: string) => ['items', 'source', id] as const,
  search: (q: string) => ['search', q] as const,
  graph: ['graph'] as const,
  goals: ['goals'] as const,
  knowledge: ['knowledge'] as const,
  view: (id: string) => ['knowledge', 'view', id] as const,
  preview: (id: string) => ['knowledge', 'preview', id] as const,
  projects: ['projects'] as const,
  board: (id: string) => ['projects', id] as const,
  goal: (id: string) => ['goals', id] as const,
  lint: ['lint'] as const,
  inbox: ['inbox'] as const,
  history: ['history'] as const,
  stats: ['stats'] as const,
  timeline: ['timeline'] as const,
  tags: ['tags'] as const,
  config: ['config'] as const,
}

export const configQuery = (api: Api) =>
  queryOptions({
    queryKey: keys.config,
    queryFn: () => api.call((c) => c.config.read()),
    retry: false,
  })

export const healthQuery = (api: Api) =>
  queryOptions({ queryKey: keys.health, queryFn: () => api.call((c) => c.meta.health()) })

export interface ListParams {
  readonly type?: 'goal' | 'project' | 'task' | 'adr' | 'doc' | 'context' | 'runbook'
  readonly status?: string
  readonly project?: string
  readonly limit?: number
}

export const itemsQuery = (api: Api, params: ListParams = {}) =>
  queryOptions({
    queryKey: keys.items(params),
    queryFn: () =>
      api.call((c) =>
        c.items.list({
          query: {
            ...(params.type ? { type: params.type } : {}),
            ...(params.status ? { status: params.status } : {}),
            ...(params.project ? { project: params.project } : {}),
            limit: params.limit ?? 200,
          },
        }),
      ),
  })

export const itemQuery = (api: Api, id: string) =>
  queryOptions({
    queryKey: keys.item(id),
    queryFn: () => api.call((c) => c.items.get({ params: { id } })),
    retry: false,
  })

export const inboxQuery = (api: Api, since?: string) =>
  queryOptions({
    queryKey: since === undefined ? keys.inbox : [...keys.inbox, since],
    queryFn: () => api.call((c) => c.inbox.inbox({ query: since === undefined ? {} : { since } })),
  })

export const useHealth = (api: Api) => useQuery(healthQuery(api))
export const useInbox = (api: Api) => useQuery(inboxQuery(api))

export const sourceQuery = (api: Api, id: string) =>
  queryOptions({
    queryKey: keys.source(id),
    queryFn: () => api.call((c) => c.items.source({ params: { id } })),
    retry: false,
  })

export const goalsQuery = (api: Api) =>
  queryOptions({ queryKey: keys.goals, queryFn: () => api.call((c) => c.goals.list()) })

export const goalQuery = (api: Api, id: string) =>
  queryOptions({
    queryKey: keys.goal(id),
    queryFn: () => api.call((c) => c.goals.get({ params: { id } })),
    retry: false,
  })

export const graphQuery = (api: Api, asOf?: string) =>
  queryOptions({
    queryKey: asOf === undefined ? keys.graph : ([...keys.graph, asOf] as const),
    queryFn: () => api.call((c) => c.graph.graph({ query: asOf === undefined ? {} : { asOf } })),
    ...(asOf === undefined ? {} : { staleTime: 5 * 60_000 }),
  })

export const projectsQuery = (api: Api) =>
  queryOptions({ queryKey: keys.projects, queryFn: () => api.call((c) => c.projects.list()) })

export const boardQuery = (api: Api, id: string) =>
  queryOptions({
    queryKey: keys.board(id),
    queryFn: () => api.call((c) => c.projects.board({ params: { id } })),
    retry: false,
  })

export const knowledgeQuery = (api: Api) =>
  queryOptions({ queryKey: keys.knowledge, queryFn: () => api.call((c) => c.knowledge.list()) })

export const previewQuery = (api: Api, id: string) =>
  queryOptions({
    queryKey: keys.preview(id),
    queryFn: () => api.call((c) => c.knowledge.preview({ params: { id } })),
    retry: false,
  })

export const viewQuery = (api: Api, id: string) =>
  queryOptions({
    queryKey: keys.view(id),
    queryFn: () => api.call((c) => c.knowledge.view({ params: { id } })),
    retry: false,
  })

export const decisionsQuery = (api: Api) =>
  queryOptions({
    queryKey: [...keys.history, 'decisions'] as const,
    queryFn: () => api.call((c) => c.history.decisions({ query: {} })),
    retry: false,
  })

export const itemHistoryQuery = (api: Api, id: string) =>
  queryOptions({
    queryKey: [...keys.history, 'item', id] as const,
    queryFn: () => api.call((c) => c.history.item({ params: { id } })),
    retry: false,
  })

export const searchQuery = (api: Api, q: string) =>
  queryOptions({
    queryKey: keys.search(q),
    queryFn: () => api.call((c) => c.search.search({ query: { q, limit: 40 } })),
    enabled: q.trim() !== '',
    retry: false,
  })

export const periodStatsQuery = (
  api: Api,
  period: '30d' | 'quarter' | 'year' = '30d',
  area?: string,
) =>
  queryOptions({
    queryKey: [...keys.stats, 'period', period, area ?? ''] as const,
    queryFn: () =>
      api.call((c) =>
        c.stats.period({ query: { period, ...(area === undefined ? {} : { area }) } }),
      ),
    retry: false,
  })

export const timelineQuery = (api: Api, range: { from?: string; to?: string } = {}) =>
  queryOptions({
    queryKey: [...keys.timeline, range] as const,
    queryFn: () => api.call((c) => c.timeline.timeline({ query: range })),
    retry: false,
  })

export const tagMapQuery = (api: Api) =>
  queryOptions({
    queryKey: [...keys.tags, 'map'] as const,
    queryFn: () => api.call((c) => c.tags.map()),
  })

export const tagsQuery = (api: Api) =>
  queryOptions({ queryKey: keys.tags, queryFn: () => api.call((c) => c.tags.list()) })

export const waitingCount = (inbox: {
  readonly proposed: ReadonlyArray<unknown>
  readonly freshness: ReadonlyArray<unknown>
  readonly errors: ReadonlyArray<unknown>
  readonly blocked: ReadonlyArray<unknown>
}) => inbox.proposed.length + inbox.freshness.length + inbox.errors.length + inbox.blocked.length
