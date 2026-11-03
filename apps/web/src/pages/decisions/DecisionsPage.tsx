import {
  DecisionHeading,
  DecisionLanes,
  DecisionLegend,
  DecisionNotices,
  DecisionProvider,
} from '@/features/decisions'
import { PageTemplate } from '@/templates'

/** The decision log: every ADR status change, a lane per project. */
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
