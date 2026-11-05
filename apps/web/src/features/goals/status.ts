import type { StatusName } from '@netherite/ui'

export const statusOfProgress = (done: number, total: number): StatusName =>
  total > 0 && done >= total ? 'done' : done > 0 ? 'progress' : 'backlog'
