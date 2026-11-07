import { Avatar } from '@mantine/core'
import { layout } from '@netherite/tokens'
import { avatarClasses } from './Avatar.classes'

export const avatarTheme = Avatar.extend({
  classNames: avatarClasses,
  defaultProps: { size: layout.avatar, radius: 'xl' },
})
