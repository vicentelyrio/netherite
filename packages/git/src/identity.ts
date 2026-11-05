export interface GitIdentity {
  readonly name: string | undefined
  readonly email: string | undefined
  /** `github.user` from git config, if set. */
  readonly github: string | undefined
}

/**
 * The `@handle` for a git identity. It uses `github.user` when set, then the part of the e-mail
 * before `@` (without a `+tag`), then the name; characters outside letters, digits, `_`, `.` and
 * `-` are replaced. Returns `undefined` when nothing usable is left.
 */
export const handleFrom = (identity: GitIdentity): string | undefined => {
  const candidates = [identity.github, identity.email?.split('@')[0]?.split('+')[0], identity.name]
  for (const candidate of candidates) {
    const cleaned = candidate
      ?.trim()
      .replace(/\s+/g, '-')
      .replace(/[^A-Za-z0-9_.-]/g, '')
      .replace(/^[-_.]+/, '')
    if (cleaned) return `@${cleaned}`
  }
  return undefined
}
