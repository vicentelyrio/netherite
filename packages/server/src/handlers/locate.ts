import { NotFound, Refused } from '@netherite/api'
import type { ScannedItem } from '@netherite/core'
import { Effect } from 'effect'
import type { ServerState } from '../state'

export const locate = (state: ServerState, id: string) => {
  const found = state.repo.index.findById(id)
  if (found.length === 0)
    return Effect.fail(new NotFound({ message: `No item has the ID ${id}`, id }))
  if (found.length > 1) {
    return Effect.fail(
      new Refused({
        message: `${id} is used by ${found.length} items`,
        reason: 'ambiguous-id',
        paths: found.map((i) => i.path),
      }),
    )
  }
  return Effect.succeed(found[0] as ScannedItem)
}
