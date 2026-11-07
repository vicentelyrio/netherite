import { Schema } from 'effect'
import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { NotFound } from '../errors'
import { Health } from '../models'

export class MetaGroup extends HttpApiGroup.make('meta').add(
  HttpApiEndpoint.get('health', '/health', { success: Health }),
  HttpApiEndpoint.get('schema', '/schemas/:type', {
    params: { type: Schema.String },
    success: Schema.Unknown,
    error: NotFound,
  }),
) {}
