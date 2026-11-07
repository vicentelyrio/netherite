import { useRef } from 'react'
import { defaultBrand, defaultRailLabel } from './Rail.constants'
import type { RailItem, RailProps } from './Rail.types'
import { RailButton } from './RailButton'
import { runsOf } from './runsOf'
import { useRailKeyboard } from './useRailKeyboard'

export function Rail({
  items,
  active,
  onSelect,
  brand,
  footer,
  label = defaultRailLabel,
}: RailProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const onKeyDown = useRailKeyboard(listRef)

  const render = (item: RailItem) => (
    <RailButton key={item.id} item={item} current={item.id === active} onSelect={onSelect} />
  )

  const runs = runsOf(items)
  const top = runs.filter((r) => r.group === undefined)
  const groups = runs.filter((r) => r.group !== undefined)

  return (
    <nav className="nt-rail" aria-label={label} onKeyDown={onKeyDown}>
      <div className="nt-rail-brand" aria-hidden="true">
        {brand ?? defaultBrand}
      </div>
      <div className="nt-rail-list" ref={listRef}>
        <div className="nt-rail-top">{top.flatMap((r) => r.items.map(render))}</div>
        <div className="nt-rail-groups">
          {groups.map((run, i) => (
            <div key={i} className="nt-rail-group">
              {run.items.map(render)}
            </div>
          ))}
        </div>
        <div className="nt-rail-footer">{footer}</div>
      </div>
    </nav>
  )
}
