import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { NotFound, Refused } from '../errors'
import { LintQuery, LintReport, LintTextPayload } from '../models'

export class LintGroup extends HttpApiGroup.make('lint').add(
  HttpApiEndpoint.get('lint', '/lint', {
    query: LintQuery,
    success: LintReport,
    error: [NotFound, Refused],
  }),
) {}

export class LintTextGroup extends HttpApiGroup.make('lintText').add(
  HttpApiEndpoint.post('lintText', '/lint/text', {
    payload: LintTextPayload,
    success: LintReport,
    error: [NotFound, Refused],
  }),
) {}
