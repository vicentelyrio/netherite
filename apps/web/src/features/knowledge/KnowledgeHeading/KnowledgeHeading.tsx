import { Breadcrumbs } from '@/components'
import { useKnowledgeIndex } from '../KnowledgeProvider'

/** Breadcrumb, title and how many files there are. */
export function KnowledgeHeading() {
  const { rows } = useKnowledgeIndex()
  return (
    <div>
      <Breadcrumbs icon="stacks">
        <strong>Knowledge</strong>
      </Breadcrumbs>
      <h1 className="app-title kn-h1">Knowledge</h1>
      <p className="kn-sub">
        Docs, decisions and agent context ·{' '}
        {rows.length === 0 ? 'nothing in knowledge/ yet' : `${rows.length} files in knowledge/`}
      </p>
    </div>
  )
}
