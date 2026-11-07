import { Avatar as MantineAvatar } from '@mantine/core'
import type { AvatarProps } from './Avatar.types'
import { avatarColorOf } from './avatarColorOf'
import { initialsOf } from './initialsOf'

export function Avatar({ name, src, size = 'sm', color }: AvatarProps) {
  return (
    <MantineAvatar
      {...(src === undefined ? {} : { src })}
      alt={name}
      size={size}
      variant="filled"
      color={color ?? avatarColorOf(name)}
      name={name}
    >
      {initialsOf(name)}
    </MantineAvatar>
  )
}
