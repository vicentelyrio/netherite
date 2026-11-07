import {
  KnowledgeActions,
  KnowledgeHeading,
  KnowledgePreview,
  KnowledgeStarters,
  KnowledgeTable,
  KnowledgeToolbar,
  useKnowledgeIndex,
} from '@/features/knowledge'
import { PageTemplate, SplitTemplate } from '@/templates'

export function KnowledgeContent() {
  const { rows } = useKnowledgeIndex()
  if (rows.length === 0) {
    return (
      <PageTemplate header={<KnowledgeHeading />} actions={<KnowledgeActions />}>
        <KnowledgeStarters />
      </PageTemplate>
    )
  }
  return (
    <SplitTemplate
      header={<KnowledgeHeading />}
      actions={<KnowledgeActions />}
      toolbar={<KnowledgeToolbar />}
      main={<KnowledgeTable />}
      aside={<KnowledgePreview />}
    />
  )
}
