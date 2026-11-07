import type { ItemDetail } from '@netherite/api'
import { ActionIcon } from '@netherite/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { keys, useWrite } from '@/infrastructure/query'

export function DocUnlink({ item, to }: { readonly item: ItemDetail; readonly to: string }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const client = useQueryClient()
  const unlink = useWrite(
    api,
    (a, _: undefined) =>
      a.call((c) =>
        c.items.unlink({
          params: { id: item.id },
          query: { to, kind: 'explains', baseHash: item.hash },
        }),
      ),
    { reload: () => void client.invalidateQueries({ queryKey: keys.item(item.id) }) },
  )
  return (
    <ActionIcon
      icon="close"
      label={LL.knowledge.doc.panel.unlink({ id: to })}
      variant="subtle"
      color="gray"
      size="sm"
      loading={unlink.isPending}
      onClick={() => unlink.mutate(undefined)}
    />
  )
}
