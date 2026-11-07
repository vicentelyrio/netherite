import type { AdrStatus, StateCategory } from '@netherite/tokens'

export const adrIcons: Record<AdrStatus, string> = {
  proposed: 'pending',
  accepted: 'check_circle',
  deprecated: 'block',
  superseded: 'swap_horiz',
}

export const stateIcons: Record<StateCategory, string> = {
  todo: 'radio_button_unchecked',
  active: 'play_circle',
  blocked: 'pause',
  done: 'check_circle',
}
