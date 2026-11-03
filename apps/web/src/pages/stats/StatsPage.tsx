import {
  AdrActivityCard,
  ProgressCard,
  StatsHeading,
  StatsProvider,
  StatsTiles,
  ThroughputCard,
} from '@/features/stats'
import { PageTemplate } from '@/templates'

/** Stats: how work moved over time, from the git history. */
export function StatsPage() {
  return (
    <StatsProvider>
      <PageTemplate header={<StatsHeading />}>
        <StatsTiles />
        <ThroughputCard />
        <ProgressCard />
        <AdrActivityCard />
      </PageTemplate>
    </StatsProvider>
  )
}
