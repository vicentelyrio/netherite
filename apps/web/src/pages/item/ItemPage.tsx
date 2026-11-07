import { ItemView } from '@/features/items'
import { DocView, knowledgeTypes } from '@/features/knowledge'

export function ItemPage({
  id,
  mode,
  fill,
}: {
  readonly id: string
  readonly mode?: 'split'
  readonly fill?: boolean
}) {
  return (
    <ItemView
      id={id}
      special={(item) =>
        knowledgeTypes.has(item.type) ? (
          <DocView item={item} {...(mode ? { mode } : {})} {...(fill ? { fill } : {})} />
        ) : undefined
      }
    />
  )
}
