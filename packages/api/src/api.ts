import { Schema } from 'effect'
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from 'effect/http-api'
import { Conflict, Failure, Invalid, NotFound, Refused, Unavailable } from './errors'
import {
  Board,
  CheckPayload,
  CreatePayload,
  DecisionLog,
  DecisionQuery,
  DeleteQuery,
  DeleteResult,
  GoalDetail,
  GoalList,
  Graph,
  GraphQuery,
  Health,
  Inbox,
  InboxQuery,
  ItemDetail,
  ItemHistory,
  ItemList,
  ItemSource,
  KnowledgeList,
  KnowledgePreview,
  KnowledgeView,
  LinkPayload,
  LintQuery,
  LintReport,
  LintTextPayload,
  ListQuery,
  ProjectList,
  RenameTagPayload,
  RenameTagResult,
  ReviewPayload,
  SearchQuery,
  SearchResult,
  ServerEvent,
  SourcePayload,
  StatePayload,
  Stats,
  StatsQuery,
  TagList,
  UnlinkQuery,
  UpdatePayload,
  WriteResult,
} from './models'

const id = { id: Schema.String }
const writes = [Invalid, Conflict, NotFound, Refused, Failure] as const

/** Reading and writing items. Every write returns the new `hash` and the files it changed. */
export class ItemsGroup extends HttpApiGroup.make('items').add(
  HttpApiEndpoint.get('list', '/items', {
    query: ListQuery,
    success: ItemList,
    error: Invalid,
  }),
  HttpApiEndpoint.get('get', '/items/:id', {
    params: id,
    success: ItemDetail,
    error: [NotFound, Refused],
  }),
  HttpApiEndpoint.get('source', '/items/:id/source', {
    params: id,
    success: ItemSource,
    error: [NotFound, Refused, Failure],
  }),
  HttpApiEndpoint.put('replaceSource', '/items/:id/source', {
    params: id,
    payload: SourcePayload,
    success: WriteResult,
    error: writes,
  }),
  HttpApiEndpoint.post('create', '/items', {
    payload: CreatePayload,
    success: WriteResult.pipe(HttpApiSchema.status(201)),
    error: writes,
  }),
  HttpApiEndpoint.patch('update', '/items/:id', {
    params: id,
    payload: UpdatePayload,
    success: WriteResult,
    error: writes,
  }),
  HttpApiEndpoint.put('setState', '/items/:id/state', {
    params: id,
    payload: StatePayload,
    success: WriteResult,
    error: writes,
  }),
  HttpApiEndpoint.post('toggleCheck', '/items/:id/checks', {
    params: id,
    payload: CheckPayload,
    success: WriteResult,
    error: writes,
  }),
  HttpApiEndpoint.post('link', '/items/:id/links', {
    params: id,
    payload: LinkPayload,
    success: WriteResult,
    error: writes,
  }),
  HttpApiEndpoint.delete('unlink', '/items/:id/links', {
    params: id,
    query: UnlinkQuery,
    success: WriteResult,
    error: writes,
  }),
  HttpApiEndpoint.post('markReviewed', '/items/:id/review', {
    params: id,
    payload: ReviewPayload,
    success: WriteResult,
    error: writes,
  }),
  HttpApiEndpoint.delete('delete', '/items/:id', {
    params: id,
    query: DeleteQuery,
    success: DeleteResult,
    error: writes,
  }),
) {}

export class SearchGroup extends HttpApiGroup.make('search').add(
  HttpApiEndpoint.get('search', '/search', {
    query: SearchQuery,
    success: SearchResult,
    error: Invalid,
  }),
) {}

export class GraphGroup extends HttpApiGroup.make('graph').add(
  HttpApiEndpoint.get('graph', '/graph', {
    query: GraphQuery,
    success: Graph,
    error: [Invalid, Unavailable, Failure],
  }),
) {}

export class GoalsGroup extends HttpApiGroup.make('goals').add(
  HttpApiEndpoint.get('list', '/goals', { success: GoalList }),
  HttpApiEndpoint.get('get', '/goals/:id', {
    params: id,
    success: GoalDetail,
    error: [NotFound, Refused],
  }),
) {}

export class ProjectsGroup extends HttpApiGroup.make('projects').add(
  HttpApiEndpoint.get('list', '/projects', { success: ProjectList }),
  HttpApiEndpoint.get('board', '/projects/:id/board', {
    params: id,
    success: Board,
    error: [NotFound, Refused],
  }),
) {}

export class KnowledgeGroup extends HttpApiGroup.make('knowledge').add(
  HttpApiEndpoint.get('list', '/knowledge', { success: KnowledgeList }),
  HttpApiEndpoint.get('preview', '/knowledge/:id/preview', {
    params: id,
    success: KnowledgePreview,
    error: [NotFound, Refused, Failure],
  }),
  HttpApiEndpoint.get('view', '/knowledge/:id/view', {
    params: id,
    success: KnowledgeView,
    error: [NotFound, Refused, Failure],
  }),
) {}

export class TagsGroup extends HttpApiGroup.make('tags').add(
  HttpApiEndpoint.get('list', '/tags', { success: TagList }),
  HttpApiEndpoint.post('rename', '/tags/rename', {
    payload: RenameTagPayload,
    success: RenameTagResult,
    error: writes,
  }),
) {}

export class LintGroup extends HttpApiGroup.make('lint').add(
  HttpApiEndpoint.get('lint', '/lint', {
    query: LintQuery,
    success: LintReport,
    error: [NotFound, Refused],
  }),
) {}

export class LintTextGroup extends HttpApiGroup.make('lintText').add(
  HttpApiEndpoint.post('lintText', '/lint/text', {
    payload: LintTextPayload,
    success: LintReport,
    error: [NotFound, Refused],
  }),
) {}

export class InboxGroup extends HttpApiGroup.make('inbox').add(
  HttpApiEndpoint.get('inbox', '/inbox', {
    query: InboxQuery,
    success: Inbox,
    error: [Invalid, Failure],
  }),
) {}

export class HistoryGroup extends HttpApiGroup.make('history').add(
  HttpApiEndpoint.get('decisions', '/history/decisions', {
    query: DecisionQuery,
    success: DecisionLog,
    error: [Unavailable, Failure],
  }),
  HttpApiEndpoint.get('item', '/history/items/:id', {
    params: id,
    success: ItemHistory,
    error: [NotFound, Unavailable, Failure],
  }),
) {}

export class StatsGroup extends HttpApiGroup.make('stats').add(
  HttpApiEndpoint.get('stats', '/stats', {
    query: StatsQuery,
    success: Stats,
    error: [Invalid, Unavailable, Failure],
  }),
) {}

/** Server-sent events: connect with `EventSource` or the typed client. */
export class EventsGroup extends HttpApiGroup.make('events').add(
  HttpApiEndpoint.get('events', '/events', {
    success: HttpApiSchema.StreamSse({ data: ServerEvent }),
  }),
) {}

export class MetaGroup extends HttpApiGroup.make('meta').add(
  HttpApiEndpoint.get('health', '/health', { success: Health }),
  HttpApiEndpoint.get('schema', '/schemas/:type', {
    params: { type: Schema.String },
    success: Schema.Unknown,
    error: NotFound,
  }),
) {}

/**
 * The local server's HTTP API (ADR-00010), defined once. The server implements it, the app
 * calls it through `makeClient`, and the OpenAPI document is derived from it.
 */
export class NetheriteApi extends HttpApi.make('netherite')
  .add(
    ItemsGroup,
    SearchGroup,
    GraphGroup,
    GoalsGroup,
    ProjectsGroup,
    KnowledgeGroup,
    TagsGroup,
    LintGroup,
    LintTextGroup,
    InboxGroup,
    HistoryGroup,
    StatsGroup,
    EventsGroup,
    MetaGroup,
  )
  .prefix('/api') {}
