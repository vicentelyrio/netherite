export const avatarColors = [
  'warning',
  'lavender',
  'success',
  'adr',
  'doc',
  'context',
  'runbook',
] as const

export type AvatarColor = (typeof avatarColors)[number]
