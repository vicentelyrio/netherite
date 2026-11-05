import { TimeScrubber } from '@/components'
import { useGraphTime } from './GraphTime'

/** The time slider over the graph; absent when there is no history to go back through. */
export function GraphScrubber() {
  const { asOf, setAsOf, playing, togglePlay, range } = useGraphTime()
  if (range === undefined) return null
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
