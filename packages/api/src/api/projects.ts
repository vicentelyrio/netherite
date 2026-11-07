import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { NotFound, Refused } from '../errors'
import { Board, ProjectList } from '../models'
import { id } from './shared'

export class ProjectsGroup extends HttpApiGroup.make('projects').add(
  HttpApiEndpoint.get('list', '/projects', { success: ProjectList }),
  HttpApiEndpoint.get('board', '/projects/:id/board', {
    params: id,
    success: Board,
    error: [NotFound, Refused],
  }),
) {}
