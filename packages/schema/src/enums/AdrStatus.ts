export const AdrStatus = {
  Proposed: 'proposed',
  Accepted: 'accepted',
  Deprecated: 'deprecated',
  Superseded: 'superseded',
} as const

export type AdrStatus = (typeof AdrStatus)[keyof typeof AdrStatus]
