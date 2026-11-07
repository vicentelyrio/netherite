import { useKnowledgeIndex } from '../KnowledgeProvider'
import { KnowledgePreviewContent } from './KnowledgePreviewContent'
import './KnowledgePreview.css'

export function KnowledgePreview() {
  const { current } = useKnowledgeIndex()
  return current ? <KnowledgePreviewContent row={current} /> : null
}
