import type { StatusName } from '@netherite/ui'

/** A goal or project has no state of its own to read, so its status follows how much is done. */
export const statusOfProgress = (done: number, total: number): StatusName =>
  total > 0 && done >= total ? 'done' : done > 0 ? 'progress' : 'backlog'
