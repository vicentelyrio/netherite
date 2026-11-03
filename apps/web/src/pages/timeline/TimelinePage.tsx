import {
  TimelineChart,
  TimelineControls,
  TimelineHeading,
  TimelineProvider,
} from '@/features/timeline'
import { PageTemplate } from '@/templates'

/** The timeline: goals, projects, tasks and decisions on one axis, from the git history. */
export function TimelinePage() {
  return (
    <TimelineProvider>
      <PageTemplate header={<TimelineHeading />} toolbar={<TimelineControls />}>
        <TimelineChart />
      </PageTemplate>
    </TimelineProvider>
  )
}
