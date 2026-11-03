import { FilterTabs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useDecisions } from '../DecisionProvider'
import { statusLabel, statusStyle } from '../lanes'
import './DecisionLegend.css'

/** What each colour means, and tabs that narrow the log to one project. */
export function DecisionLegend() {
  const { LL } = useI18nContext()
  const { all, project, setProject } = useDecisions()
  return (
    <div className="dl-legend">
      {Object.entries(statusStyle).map(([key, s]) => (
        <span key={key}>
          <span className="dl-legend-dot" style={{ borderColor: s.color, background: s.color }} />
          {statusLabel(LL, key)}
        </span>
      ))}
      <span>
        <span className="dl-legend-dot" style={{ borderColor: '#969ab8', background: '#282a3f' }} />
        {LL.decisions.supersession()}
      </span>
      <span className="dl-rule" />
      <FilterTabs
        label={LL.decisions.project()}
        options={[
          { value: '', label: LL.decisions.allProjects() },
          ...all.map((l) => ({ value: l.project, label: l.project })),
        ]}
        value={project}
        onChange={setProject}
      />
    </div>
  )
}
