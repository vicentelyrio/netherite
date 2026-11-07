import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Failure, NotFound, Refused } from '../errors'
import { KnowledgeList, KnowledgePreview, KnowledgeView } from '../models'
import { id } from './shared'

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
