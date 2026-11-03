import { StatsBoard, StatsControls, StatsHeading, StatsProvider } from '@/features/stats'
import { PageTemplate } from '@/templates'

/** Stats: what was created and done, how long it took, and how knowledge fares, from git. */
export function StatsPage() {
  return (
    <StatsProvider>
      <PageTemplate header={<StatsHeading />} toolbar={<StatsControls />}>
        <StatsBoard />
      </PageTemplate>
    </StatsProvider>
  )
}
