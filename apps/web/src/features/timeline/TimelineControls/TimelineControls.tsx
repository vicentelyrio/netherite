import { FilterTabs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { zooms } from '../layout'
import { useTimeline } from '../TimelineProvider'
import './TimelineControls.css'

export function TimelineControls() {
  const { LL } = useI18nContext()
  const { zoom, setZoom, showTasks, setShowTasks, showDecisions, setShowDecisions } = useTimeline()
  const names = {
    fit: LL.timeline.zoom.fit(),
    quarter: LL.timeline.zoom.quarter(),
    year: LL.timeline.zoom.year(),
    'two-years': LL.timeline.zoom.twoYears(),
  }
  return (
    <div className="tl-head">
      <div className="tl-controls">
        <FilterTabs
          label={LL.timeline.zoom.label()}
          options={zooms.map((z) => ({ value: z, label: names[z] }))}
          value={zoom}
          onChange={setZoom}
        />
        <button
          type="button"
          className="tl-toggle"
          aria-pressed={showTasks}
          onClick={() => setShowTasks(!showTasks)}
        >
          {LL.timeline.tasks()}
        </button>
        <button
          type="button"
          className="tl-toggle"
          aria-pressed={showDecisions}
          onClick={() => setShowDecisions(!showDecisions)}
        >
          {LL.timeline.decisions()}
        </button>
      </div>
      <ul className="tl-legend" aria-label={LL.timeline.legend.active()}>
        <li>
          <span className="tl-key" data-kind="active" />
          {LL.timeline.legend.active()}
        </li>
        <li>
          <span className="tl-key" data-kind="hold" />
          {LL.timeline.legend.hold()}
        </li>
        <li>
          <span className="tl-key" data-kind="wait" />
          {LL.timeline.legend.waiting()}
        </li>
        <li>
          <span className="tl-key" data-kind="planned" />
          {LL.timeline.legend.planned()}
        </li>
        <li>
          <span className="tl-key" data-kind="overdue" />
          {LL.timeline.legend.overdue()}
        </li>
        <li>
          <span className="tl-key" data-kind="proposed" />
          <span className="tl-key" data-kind="accepted" />
          {LL.timeline.legend.decision()}
        </li>
      </ul>
    </div>
  )
}
