const seenKey = 'netherite:inbox-seen'

export const lastSeen = (): string | undefined => {
  try {
    return localStorage.getItem(seenKey) ?? undefined
  } catch {
    return undefined
  }
}

export const markSeen = (at: string) => {
  try {
    localStorage.setItem(seenKey, at)
  } catch {}
}
