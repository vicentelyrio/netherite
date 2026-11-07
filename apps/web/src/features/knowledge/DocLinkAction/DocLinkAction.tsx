import type { ItemDetail, ItemSummary } from '@netherite/api'
import { itemTypes } from '@netherite/schema'
import { Button } from '@netherite/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MovePicker } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { itemsQuery, keys, useWrite } from '@/infrastructure/query'

export const linkGroups = (
  items: ReadonlyArray<ItemSummary>,
  item: Pick<ItemDetail, 'id' | 'links'>,
) => {
  const linked = new Set(item.links.filter((l) => l.kind === 'explains').map((l) => l.id))
  return itemTypes.flatMap((type) => {
    const options = items
      .filter((i) => i.type === type && i.id !== item.id)
      .map((i) => ({ id: i.id, title: i.title, detail: i.id, current: linked.has(i.id) }))
    return options.length === 0 ? [] : [{ type, options }]
  })
}

export function DocLinkAction({ item }: { readonly item: ItemDetail }) {
  const { LL } = useI18nContext()
  const text = LL.knowledge.doc.panel
  const api = useApi()
  const client = useQueryClient()
  const [picking, setPicking] = useState(false)
  const items = useQuery({ ...itemsQuery(api, { limit: 500 }), enabled: picking })
  const link = useWrite(
    api,
    (a, to: string) =>
      a.call((c) =>
        c.items.link({
          params: { id: item.id },
          payload: { to, kind: 'explains', baseHash: item.hash },
        }),
      ),
    { reload: () => void client.invalidateQueries({ queryKey: keys.item(item.id) }) },
  )
  return (
    <>
      <Button size="sm" icon="add_link" loading={link.isPending} onClick={() => setPicking(true)}>
        {text.linkTo()}
      </Button>
      <MovePicker
        opened={picking}
        title={text.linkTitle({ name: item.title })}
        currentLabel={text.linked()}
        groups={linkGroups(items.data?.items ?? [], item).map(({ type, options }) => ({
          label: LL.components.graph.types[type](),
          options,
        }))}
        onClose={() => setPicking(false)}
        onPick={(to) => link.mutate(to)}
      />
    </>
  )
}
