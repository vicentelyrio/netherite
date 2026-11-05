export interface GitIdentity {
  readonly name: string | undefined
  readonly email: string | undefined
  readonly github: string | undefined
}

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
