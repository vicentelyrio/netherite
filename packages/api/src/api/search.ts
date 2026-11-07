import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Invalid } from '../errors'
import { SearchQuery, SearchResult } from '../models'

export class SearchGroup extends HttpApiGroup.make('search').add(
  HttpApiEndpoint.get('search', '/search', {
    query: SearchQuery,
    success: SearchResult,
    error: Invalid,
  }),
) {}
