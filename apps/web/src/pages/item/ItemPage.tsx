import { ItemView } from '@/features/items'
import { DocView, knowledgeTypes } from '@/features/knowledge'

export function ItemPage({ id, mode }: { readonly id: string; readonly mode?: 'split' }) {
  return (
    <ItemView
      id={id}
      special={(item) =>
        knowledgeTypes.has(item.type) ? (
          <DocView item={item} {...(mode ? { mode } : {})} />
        ) : undefined
      }
    />
  )
}
