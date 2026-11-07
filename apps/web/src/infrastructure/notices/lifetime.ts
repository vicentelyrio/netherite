import type { Notice } from './notices.types'

const plainLifetime = 5_000
const withActionsLifetime = 10_000

export const lifetime = (notice: Notice) => {
  if (notice.persistent || notice.variant === 'danger' || notice.variant === 'warning') {
    return undefined
  }
  return notice.actions ? withActionsLifetime : plainLifetime
}
