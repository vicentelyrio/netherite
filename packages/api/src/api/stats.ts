import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import { Failure, Invalid, Unavailable } from '../errors'
import { PeriodStats, PeriodStatsQuery, Stats, StatsQuery } from '../models'

export class StatsGroup extends HttpApiGroup.make('stats').add(
  HttpApiEndpoint.get('stats', '/stats', {
    query: StatsQuery,
    success: Stats,
    error: [Invalid, Unavailable, Failure],
  }),
  HttpApiEndpoint.get('period', '/stats/period', {
    query: PeriodStatsQuery,
    success: PeriodStats,
    error: [Invalid, Unavailable, Failure],
  }),
) {}
