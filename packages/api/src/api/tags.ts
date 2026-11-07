import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { RenameTagPayload, RenameTagResult, TagList, TagMap } from '../models'
import { writes } from './shared'

export class TagsGroup extends HttpApiGroup.make('tags').add(
  HttpApiEndpoint.get('list', '/tags', { success: TagList }),
  HttpApiEndpoint.get('map', '/tags/map', { success: TagMap }),
  HttpApiEndpoint.post('rename', '/tags/rename', {
    payload: RenameTagPayload,
    success: RenameTagResult,
    error: writes,
  }),
) {}
