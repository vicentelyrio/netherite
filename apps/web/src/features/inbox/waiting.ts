const seenKey = 'netherite:inbox-seen'

/** When the Inbox was last marked as seen, kept in this browser. */
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
