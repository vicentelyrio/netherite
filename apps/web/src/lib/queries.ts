import { queryOptions, useQuery } from '@tanstack/react-query'
import type { Api } from './api'

/**
 * Query keys, grouped so one invalidation can cover a family: `['items']` is every list and
 * every item, `['item', id]` is one.
 */
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
}

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

export const inboxQuery = (api: Api) =>
  queryOptions({
    queryKey: keys.inbox,
    queryFn: () => api.call((c) => c.inbox.inbox({ query: {} })),
  })

export const useHealth = (api: Api) => useQuery(healthQuery(api))
export const useInbox = (api: Api) => useQuery(inboxQuery(api))

/** The whole file, for the editor. Refreshes with every other item query. */
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

export const graphQuery = (api: Api) =>
  queryOptions({ queryKey: keys.graph, queryFn: () => api.call((c) => c.graph.graph()) })

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
