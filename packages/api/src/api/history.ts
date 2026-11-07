import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Failure, NotFound, Unavailable } from '../errors'
import { DecisionLog, DecisionQuery, ItemHistory } from '../models'
import { id } from './shared'

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
