import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Failure, Invalid } from '../errors'
import {
  CapturePayload,
  CaptureQuery,
  CaptureRemoved,
  CaptureResult,
  Inbox,
  InboxQuery,
} from '../models'
import { writes } from './shared'

export class InboxGroup extends HttpApiGroup.make('inbox').add(
  HttpApiEndpoint.get('inbox', '/inbox', {
    query: InboxQuery,
    success: Inbox,
    error: [Invalid, Failure],
  }),
  HttpApiEndpoint.post('capture', '/inbox/captures', {
    payload: CapturePayload,
    success: CaptureResult,
    error: writes,
  }),
  HttpApiEndpoint.delete('release', '/inbox/captures', {
    query: CaptureQuery,
    success: CaptureRemoved,
    error: writes,
  }),
) {}
