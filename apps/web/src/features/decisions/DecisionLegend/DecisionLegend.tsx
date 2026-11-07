import { designColor, SearchSelect } from '@netherite/ui'
import { FilterTabs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useDecisions } from '../DecisionProvider'
import { noProject, statusLabel, statusStyle } from '../lanes'
import './DecisionLegend.css'

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
        <span
          className="dl-legend-dot"
          style={{ borderColor: designColor.text.muted, background: designColor.bg.canvas }}
        />
        {LL.decisions.supersession()}
      </span>
      <span className="dl-rule" />
      <FilterTabs
        label={LL.decisions.project()}
        options={[
          { value: '', label: LL.decisions.allProjects() },
          ...(all.some((l) => l.project === noProject)
            ? [{ value: noProject, label: LL.decisions.noProject() }]
            : []),
        ]}
        value={project}
        onChange={setProject}
      />
      <SearchSelect
        label={LL.decisions.project()}
        placeholder={LL.decisions.pickProject()}
        nothingFound={LL.decisions.noProjectMatch()}
        options={all.filter((l) => l.project !== noProject).map((l) => l.project)}
        value={project === '' || project === noProject ? undefined : project}
        onChange={(next) => setProject(next ?? '')}
      />
    </div>
  )
}
