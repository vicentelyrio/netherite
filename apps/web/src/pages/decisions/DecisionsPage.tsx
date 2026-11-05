import {
  DecisionHeading,
  DecisionLanes,
  DecisionLegend,
  DecisionNotices,
  DecisionProvider,
} from '@/features/decisions'
import { PageTemplate } from '@/templates'

export function DecisionsPage() {
  return (
    <DecisionProvider>
      <PageTemplate header={<DecisionHeading />} toolbar={<DecisionLegend />}>
        <DecisionNotices />
        <DecisionLanes />
      </PageTemplate>
    </DecisionProvider>
  )
}
