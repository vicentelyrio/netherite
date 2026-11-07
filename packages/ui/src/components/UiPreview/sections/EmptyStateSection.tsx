import { Button } from '../../Button'
import { EmptyState } from '../../EmptyState'
import { PreviewSection } from '../PreviewSection'

export function EmptyStateSection() {
  return (
    <PreviewSection title="Empty state">
      <EmptyState
        icon="menu_book"
        title="No knowledge yet"
        description="Docs, ADRs and context you add show up here, with what they cover and who links to them."
        actions={
          <>
            <Button variant="primary" icon="add">
              New doc
            </Button>
            <Button icon="gavel">New ADR</Button>
          </>
        }
      />
    </PreviewSection>
  )
}
