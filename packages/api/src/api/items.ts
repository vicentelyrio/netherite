import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from 'effect/http-api'
import { Failure, Invalid, NotFound, Refused } from '../errors'
import {
  CheckPayload,
  CreatePayload,
  DeleteQuery,
  DeleteResult,
  ItemDetail,
  ItemList,
  ItemSource,
  LinkPayload,
  ListQuery,
  ReviewPayload,
  SourcePayload,
  StatePayload,
  UnlinkQuery,
  UpdatePayload,
  WriteResult,
} from '../models'
import { id, writes } from './shared'

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
