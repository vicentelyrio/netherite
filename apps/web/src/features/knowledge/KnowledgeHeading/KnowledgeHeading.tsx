import { Breadcrumbs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useKnowledgeIndex } from '../KnowledgeProvider'

export function KnowledgeHeading() {
  const { LL } = useI18nContext()
  const { rows } = useKnowledgeIndex()
  return (
    <div>
      <Breadcrumbs icon="stacks">
        <strong>{LL.knowledge.heading.title()}</strong>
      </Breadcrumbs>
      <h1 className="app-title kn-h1">{LL.knowledge.heading.title()}</h1>
      <p className="kn-sub">
        {rows.length === 0
          ? LL.knowledge.heading.empty()
          : LL.knowledge.heading.summary({ count: rows.length })}
      </p>
    </div>
  )
}
