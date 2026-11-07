import { settingDefaults } from '@netherite/schema'
import type { Notice } from './notices.types'

const { lifetimeWithActionsMs } = settingDefaults.notices

export const lifetime = (notice: Notice, lifetimeMs: number) => {
  if (notice.persistent || notice.variant === 'danger' || notice.variant === 'warning') {
    return undefined
  }
  return notice.actions ? Math.max(lifetimeWithActionsMs, lifetimeMs) : lifetimeMs
}
