import { type AvatarColor, avatarColors } from './Avatar.constants'

export const avatarColorOf = (name: string) => {
  let hash = 0
  for (const ch of name.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return avatarColors[hash % avatarColors.length] as AvatarColor
}
