import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Failure, Invalid, Unavailable } from '../errors'
import { Timeline, TimelineQuery } from '../models'

export class TimelineGroup extends HttpApiGroup.make('timeline').add(
  HttpApiEndpoint.get('timeline', '/timeline', {
    query: TimelineQuery,
    success: Timeline,
    error: [Invalid, Unavailable, Failure],
  }),
) {}
