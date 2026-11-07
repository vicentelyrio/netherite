import { KnowledgeProvider } from '@/features/knowledge'
import { KnowledgeContent } from './KnowledgeContent'

export function KnowledgePage({ q }: { readonly q?: string }) {
  return (
    <KnowledgeProvider {...(q === undefined ? {} : { initialQuery: q })}>
      <KnowledgeContent />
    </KnowledgeProvider>
  )
}
