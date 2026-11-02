import { Schema } from 'effect'
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from 'effect/http-api'
import { Conflict, Failure, Invalid, NotFound, Refused, Unavailable } from './errors'
import {
  CheckPayload,
  CreatePayload,
  DecisionLog,
  DecisionQuery,
  DeleteQuery,
  DeleteResult,
  Graph,
  Health,
  Inbox,
  InboxQuery,
  ItemDetail,
  ItemHistory,
  ItemList,
  LinkPayload,
  LintQuery,
  LintReport,
  ListQuery,
  ReviewPayload,
  SearchQuery,
  SearchResult,
  StatePayload,
  Stats,
  StatsQuery,
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
  HttpApiEndpoint.get('graph', '/graph', { success: Graph }),
) {}

export class LintGroup extends HttpApiGroup.make('lint').add(
  HttpApiEndpoint.get('lint', '/lint', {
    query: LintQuery,
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
    LintGroup,
    InboxGroup,
    HistoryGroup,
    StatsGroup,
    MetaGroup,
  )
  .prefix('/api') {}
