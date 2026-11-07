import { Constant, integer } from '../define'

export const queries = {
  listLimit: integer(50, Constant, 'Items returned by a list when none is asked for.', {
    unit: 'items',
    min: 1,
  }),
  listMaxLimit: integer(500, Constant, 'Most items one list may return.', {
    unit: 'items',
    min: 1,
  }),
  searchLimit: integer(20, Constant, 'Results returned by a search when none is asked for.', {
    unit: 'items',
    min: 1,
  }),
  searchMaxLimit: integer(100, Constant, 'Most results one search may return.', {
    unit: 'items',
    min: 1,
  }),
} as const
