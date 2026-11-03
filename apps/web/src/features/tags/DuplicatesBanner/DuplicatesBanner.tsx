import { Banner, Button } from '@netherite/ui'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { useWrite } from '@/infrastructure/query'
import { keyOf } from '../rules'
import { useTags } from '../TagsProvider'

/** The likeliest duplicate pair, with a way to merge the less used into the more used, or leave both. */
export function DuplicatesBanner() {
  const { LL } = useI18nContext()
  const api = useApi()
  const notices = useNotices()
  const { all, duplicates, keepBoth } = useTags()
  const merge = useWrite(api, (a, input: { field: 'tags' | 'labels'; from: string; to: string }) =>
    a.call((c) => c.tags.rename({ payload: input })),
  )
  const pair = duplicates.find(
    (d) => all.some((t) => keyOf(t) === keyOf(d.a)) && all.some((t) => keyOf(t) === keyOf(d.b)),
  )
  if (pair === undefined) return null
  const total = (r: { field: string; name: string }) =>
    all.find((t) => keyOf(t) === keyOf(r as never))?.total ?? 0
  // The less used spelling goes into the more used one.
  const [from, into] = total(pair.a) <= total(pair.b) ? [pair.a, pair.b] : [pair.b, pair.a]
  return (
    <Banner
      variant="warning"
      title={LL.tags.duplicates.title()}
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
      {LL.tags.duplicates.text({
        a: pair.a.name,
        b: pair.b.name,
        more: duplicates.length - 1,
      })}
    </Banner>
  )
}
