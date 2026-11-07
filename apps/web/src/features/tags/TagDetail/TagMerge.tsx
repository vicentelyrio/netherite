import { Button } from '@netherite/ui'
import { useState } from 'react'
import { SelectField } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { useWrite } from '@/infrastructure/query'
import type { TagNode } from '../rules'
import { useTags } from '../TagsProvider'

export function TagMerge({
  tag,
  others,
}: {
  readonly tag: TagNode
  readonly others: ReadonlyArray<TagNode>
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const notices = useNotices()
  const { select } = useTags()
  const [into, setInto] = useState('')
  const merge = useWrite(api, (a, input: { field: 'tags' | 'labels'; from: string; to: string }) =>
    a.call((c) => c.tags.rename({ payload: input })),
  )
  return (
    <div className="td-merge">
      <SelectField
        label={LL.tags.detail.mergeInto()}
        value={into}
        options={others.map((t) => t.name)}
        onChange={setInto}
        anyLabel={LL.tags.detail.choose()}
      />
      <Button
        size="sm"
        disabled={into === ''}
        loading={merge.isPending}
        onClick={() =>
          merge.mutate(
            { field: tag.field, from: tag.name, to: into },
            {
              onSuccess: (r) => {
                notices.notify({
                  variant: 'success',
                  title: LL.tags.renamed({ name: into }),
                  text: LL.tags.changedIn({ count: r.renamed }),
                })
                setInto('')
                select(`${tag.field}:${into}`)
              },
            },
          )
        }
      >
        {LL.tags.merge()}
      </Button>
    </div>
  )
}
