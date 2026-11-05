import { TimeScrubber } from '@/components'
import { useGraphAt, useGraphTime } from './GraphTime'

export function GraphScrubber() {
  const { asOf, setAsOf, playing, togglePlay, range } = useGraphTime()
  const query = useGraphAt()
  if (range === undefined) return null
  if (query.data?.nodes.length === 0 && asOf === undefined) return null
  return (
    <TimeScrubber
      from={range.from}
      to={range.to}
      value={asOf ?? range.to}
      activity={range.activity}
      playing={playing}
      onChange={setAsOf}
      onPlayToggle={togglePlay}
      onToday={() => setAsOf(undefined)}
    />
  )
}
