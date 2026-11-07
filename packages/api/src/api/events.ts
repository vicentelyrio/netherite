import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from 'effect/http-api'
import { ServerEvent } from '../models'

export class EventsGroup extends HttpApiGroup.make('events').add(
  HttpApiEndpoint.get('events', '/events', {
    success: HttpApiSchema.StreamSse({ data: ServerEvent }),
  }),
) {}
