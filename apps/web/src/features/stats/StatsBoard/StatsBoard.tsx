import { AreasCard } from '../AreasCard'
import { HeatMapCard } from '../HeatMapCard'
import { KnowledgeCard } from '../KnowledgeCard'
import { KpiCards } from '../KpiCards'
import { ProjectsCard } from '../ProjectsCard'
import { ThroughputCard } from '../ThroughputCard'
import './StatsBoard.css'

/** The cards of the Stats screen laid out: numbers on top, then pairs of charts. */
export function StatsBoard() {
  return (
    <div className="sb">
      <KpiCards />
      <div className="sb-grid">
        <ThroughputCard />
        <AreasCard />
        <ProjectsCard />
        <KnowledgeCard />
      </div>
      <HeatMapCard />
    </div>
  )
}
