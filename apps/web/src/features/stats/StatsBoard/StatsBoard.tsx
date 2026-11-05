import { Button, EmptyState } from '@netherite/ui'
import { useNavigate } from '@tanstack/react-router'
import { useI18nContext } from '@/infrastructure/i18n'
import { AreasCard } from '../AreasCard'
import { HeatMapCard } from '../HeatMapCard'
import { KnowledgeCard } from '../KnowledgeCard'
import { KpiCards } from '../KpiCards'
import { ProjectsCard } from '../ProjectsCard'
import { useStats } from '../StatsProvider'
import { ThroughputCard } from '../ThroughputCard'
import './StatsBoard.css'

export function StatsBoard() {
  const { LL } = useI18nContext()
  const { empty } = useStats()
  const navigate = useNavigate()
  if (empty) {
    return (
      <EmptyState
        icon="bar_chart"
        title={LL.stats.empty.title()}
        description={LL.stats.empty.text()}
        actions={
          <Button
            icon="track_changes"
            variant="primary"
            onClick={() => void navigate({ to: '/goals' })}
          >
            {LL.stats.empty.action()}
          </Button>
        }
      />
    )
  }
  return (
    <div className="sb">
      <KpiCards />
      <div className="sb-top">
        <ThroughputCard />
        <AreasCard />
      </div>
      <div className="sb-bottom">
        <HeatMapCard />
        <ProjectsCard />
        <KnowledgeCard />
      </div>
    </div>
  )
}
