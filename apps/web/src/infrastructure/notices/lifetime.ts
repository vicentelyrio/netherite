import { settingDefaults } from '@netherite/schema'
import type { Notice } from './notices.types'

const { lifetimeMs, lifetimeWithActionsMs } = settingDefaults.notices

export const lifetime = (notice: Notice) => {
  if (notice.persistent || notice.variant === 'danger' || notice.variant === 'warning') {
    return undefined
  }
  return notice.actions ? lifetimeWithActionsMs : lifetimeMs
}
