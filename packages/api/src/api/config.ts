import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Conflict, Failure, Invalid, NotFound, Refused } from '../errors'
import { WorkspaceConfig, WorkspaceConfigPayload, WorkspaceConfigResult } from '../models'

const failures = [Invalid, Conflict, NotFound, Refused, Failure]

export class ConfigGroup extends HttpApiGroup.make('config').add(
  HttpApiEndpoint.get('read', '/config', { success: WorkspaceConfig, error: failures }),
  HttpApiEndpoint.patch('update', '/config', {
    payload: WorkspaceConfigPayload,
    success: WorkspaceConfigResult,
    error: failures,
  }),
) {}
