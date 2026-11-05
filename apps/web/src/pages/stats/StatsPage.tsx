import { StatsBoard, StatsControls, StatsHeading, StatsProvider } from '@/features/stats'
import { PageTemplate } from '@/templates'

export function StatsPage() {
  return (
    <StatsProvider>
      <PageTemplate header={<StatsHeading />} actions={<StatsControls />}>
        <StatsBoard />
      </PageTemplate>
    </StatsProvider>
  )
}
