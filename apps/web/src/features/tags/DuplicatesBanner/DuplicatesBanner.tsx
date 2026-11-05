import { Banner, Button } from '@netherite/ui'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { useWrite } from '@/infrastructure/query'
import { keyOf, type TagPair } from '../rules'
import { useTags } from '../TagsProvider'

/** A likely duplicate pair, with a way to merge the less used into the more used, or leave both. */
export function DuplicatesBanner({ pair }: { readonly pair: TagPair }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const notices = useNotices()
  const { all, keepBoth } = useTags()
  const merge = useWrite(api, (a, input: { field: 'tags' | 'labels'; from: string; to: string }) =>
    a.call((c) => c.tags.rename({ payload: input })),
  )
  const total = (r: { field: string; name: string }) =>
    all.find((t) => keyOf(t) === keyOf(r as never))?.total ?? 0
  const [from, into] = total(pair.a) <= total(pair.b) ? [pair.a, pair.b] : [pair.b, pair.a]
  return (
    <Banner
      variant="info"
      title={LL.tags.duplicates.note({ a: pair.a.name, b: pair.b.name })}
      actions={
        <>
          <Button
            size="sm"
            loading={merge.isPending}
            disabled={from.field !== into.field}
            onClick={() =>
              merge.mutate(
                { field: from.field, from: from.name, to: into.name },
                {
                  onSuccess: (r) =>
                    notices.notify({
                      variant: 'success',
                      title: LL.tags.renamed({ name: into.name }),
                      text: LL.tags.changedIn({ count: r.renamed }),
                    }),
                },
              )
            }
          >
            {LL.tags.duplicates.merge({ from: from.name, into: into.name })}
          </Button>
          <Button size="sm" onClick={() => keepBoth(pair)}>
            {LL.tags.duplicates.keepBoth()}
          </Button>
        </>
      }
    >
      {LL.tags.duplicates.why()}
    </Banner>
  )
}
