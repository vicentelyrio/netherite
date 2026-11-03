import { FilterTabs } from '@/components'
import { useDecisions } from '../DecisionProvider'
import { statusStyle } from '../lanes'
import './DecisionLegend.css'

/** What each colour means, and tabs that narrow the log to one project. */
export function DecisionLegend() {
  const { all, project, setProject } = useDecisions()
  return (
    <div className="dl-legend">
      {Object.entries(statusStyle).map(([key, s]) => (
        <span key={key}>
          <span className="dl-legend-dot" style={{ borderColor: s.color, background: s.color }} />
          {s.label}
        </span>
      ))}
      <span>
        <span className="dl-legend-dot" style={{ borderColor: '#969ab8', background: '#282a3f' }} />
        Supersession
      </span>
      <span className="dl-rule" />
      <FilterTabs
        label="Project"
        options={[
          { value: '', label: 'All projects' },
          ...all.map((l) => ({ value: l.project, label: l.project })),
        ]}
        value={project}
        onChange={setProject}
      />
    </div>
  )
}
