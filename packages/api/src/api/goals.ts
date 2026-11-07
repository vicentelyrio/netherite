import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { NotFound, Refused } from '../errors'
import { GoalDetail, GoalList, RenameAreaPayload, RenameTagResult } from '../models'
import { id, writes } from './shared'

export class GoalsGroup extends HttpApiGroup.make('goals').add(
  HttpApiEndpoint.get('list', '/goals', { success: GoalList }),
  HttpApiEndpoint.get('get', '/goals/:id', {
    params: id,
    success: GoalDetail,
    error: [NotFound, Refused],
  }),
  HttpApiEndpoint.post('renameArea', '/goals/rename-area', {
    payload: RenameAreaPayload,
    success: RenameTagResult,
    error: writes,
  }),
) {}
