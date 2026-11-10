import type { ItemDetail } from '@netherite/api'

export const committedChanges = (fresh: NonNullable<ItemDetail['freshness']>) =>
  fresh.commits - (fresh.uncommitted ? 1 : 0)
