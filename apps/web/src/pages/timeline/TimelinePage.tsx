import {
  TimelineChart,
  TimelineControls,
  TimelineHeading,
  TimelineProvider,
} from '@/features/timeline'
import { PageTemplate } from '@/templates'

export function TimelinePage() {
  return (
    <TimelineProvider>
      <PageTemplate header={<TimelineHeading />} actions={<TimelineControls />}>
        <TimelineChart />
      </PageTemplate>
    </TimelineProvider>
  )
}
