import { AreasCard } from '../AreasCard'
import { HeatMapCard } from '../HeatMapCard'
import { KnowledgeCard } from '../KnowledgeCard'
import { KpiCards } from '../KpiCards'
import { ProjectsCard } from '../ProjectsCard'
import { ThroughputCard } from '../ThroughputCard'
import './StatsBoard.css'

export function StatsBoard() {
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
