import {
  KnowledgeActions,
  KnowledgeHeading,
  KnowledgePreview,
  KnowledgeProvider,
  KnowledgeStarters,
  KnowledgeTable,
  KnowledgeToolbar,
  useKnowledgeIndex,
} from '@/features/knowledge'
import { PageTemplate, SplitTemplate } from '@/templates'

function Content() {
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

export function KnowledgePage({ q }: { readonly q?: string }) {
  return (
    <KnowledgeProvider {...(q === undefined ? {} : { initialQuery: q })}>
      <Content />
    </KnowledgeProvider>
  )
}
