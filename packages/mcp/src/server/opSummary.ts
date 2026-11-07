import type { OpResult } from '@netherite/core'

export const opSummary = (r: OpResult) => ({
  id: r.id,
  path: r.path,
  hash: r.hash,
  changed: r.changed,
  unchanged: r.unchanged,
})
