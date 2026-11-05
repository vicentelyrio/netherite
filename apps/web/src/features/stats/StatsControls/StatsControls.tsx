import { FilterTabs, SelectField } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { periods, useStats } from '../StatsProvider'
import './StatsControls.css'

export function StatsControls() {
  const { LL } = useI18nContext()
  const { data, empty, period, setPeriod, area, setArea } = useStats()
  if (empty) return null
  const names = {
    '30d': LL.stats.period.days(),
    quarter: LL.stats.period.quarter(),
    year: LL.stats.period.year(),
  }
  return (
    <div className="st-controls">
      <SelectField
        label={LL.stats.area()}
        value={area}
        options={data.areaNames}
        onChange={setArea}
        anyLabel={LL.stats.allAreas()}
      />
      <FilterTabs
        label={LL.stats.period.label()}
        options={periods.map((p) => ({ value: p, label: names[p] }))}
        value={period}
        onChange={setPeriod}
      />
    </div>
  )
}
