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
  } catch {
    // Private windows forget it.
  }
}

/** What waits for a person, as the Inbox counts it (and the rail badge, by the same rule). */
export const waitingCount = (inbox: {
  readonly proposed: ReadonlyArray<unknown>
  readonly freshness: ReadonlyArray<unknown>
  readonly errors: ReadonlyArray<unknown>
  readonly blocked: ReadonlyArray<unknown>
}) => inbox.proposed.length + inbox.freshness.length + inbox.errors.length + inbox.blocked.length
