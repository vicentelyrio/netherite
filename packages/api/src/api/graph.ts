import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Failure, Invalid, Unavailable } from '../errors'
import { Graph, GraphQuery } from '../models'

export class GraphGroup extends HttpApiGroup.make('graph').add(
  HttpApiEndpoint.get('graph', '/graph', {
    query: GraphQuery,
    success: Graph,
    error: [Invalid, Unavailable, Failure],
  }),
) {}
