import { ConfigFile, integer } from '../define'

export const freshness = {
  drifting: integer(1, ConfigFile, 'Commits to covered files before a doc counts as drifting.', {
    locator: 'freshness.drifting',
    unit: 'commits',
    min: 1,
  }),
  stale: integer(10, ConfigFile, 'Commits to covered files before a doc counts as stale.', {
    locator: 'freshness.stale',
    unit: 'commits',
    min: 1,
  }),
} as const
