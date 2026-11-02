import { Tooltip } from '@mantine/core'
import { icon as iconTokens } from '@netherite/tokens'
import { Fragment, type KeyboardEvent, type ReactNode, useRef } from 'react'
import { Icon } from './icon'
import { formatShortcut, useShortcuts } from './shortcuts'

export interface RailItem {
  readonly id: string
  readonly label: string
  /** A Material Symbols name. */
  readonly icon: string
  /** For example `mod+k`. Pressing it anywhere selects the item. Shown in the tooltip. */
  readonly shortcut?: string
  /**
   * More keys that do the same. For shortcuts a browser keeps for itself (such as Command-L),
   * which a page cannot take.
   */
  readonly aliases?: ReadonlyArray<string>
  /** A count to show on the item, such as items waiting in the Inbox. Hidden at 0. */
  readonly badge?: number
  /**
   * Items next to each other with the same group sit together on one sunken ground. An item with
   * no group stands on its own, like Search at the top.
   */
  readonly group?: string
}

export interface RailProps {
  readonly items: ReadonlyArray<RailItem>
  readonly active: string
  readonly onSelect: (id: string) => void
  /** The mark at the top. Default: the letter N on the accent. */
  readonly brand?: ReactNode
  /** What sits at the foot, such as the person's avatar. */
  readonly footer?: ReactNode
  /** Listen for the items' shortcuts on the whole page. Default `true`. */
  readonly shortcuts?: boolean
  /** Treat the platform as a Mac (or not). For tests and previews. */
  readonly mac?: boolean
  readonly label?: string
}

/** Runs of consecutive items that share a group, and single items that have none. */
const runsOf = (items: ReadonlyArray<RailItem>) => {
  const runs: Array<{ group: string | undefined; items: RailItem[] }> = []
  for (const item of items) {
    const last = runs.at(-1)
    if (last !== undefined && item.group !== undefined && last.group === item.group)
      last.items.push(item)
    else runs.push({ group: item.group, items: [item] })
  }
  return runs
}

/**
 * The navigation rail down the side of the app (Rail.dc.html): 64px wide, 40px items with 22px
 * icons, grouped on a sunken ground, an edge bar beside the active item. Each item can have a
 * keyboard shortcut that works from anywhere; the arrow keys move between items.
 */
export function Rail({
  items,
  active,
  onSelect,
  brand,
  footer,
  shortcuts = true,
  mac,
  label = 'Main',
}: RailProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useShortcuts(
    Object.fromEntries(
      items.flatMap((item) =>
        [item.shortcut, ...(item.aliases ?? [])].flatMap((key) =>
          key === undefined ? [] : [[key, () => onSelect(item.id)]],
        ),
      ),
    ),
    { enabled: shortcuts, ...(mac === undefined ? {} : { mac }) },
  )

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const buttons = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
    if (buttons.length === 0) return
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
    event.preventDefault()
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (at + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    buttons[next]?.focus()
  }

  const render = (item: RailItem) => {
    const hint = item.shortcut === undefined ? undefined : formatShortcut(item.shortcut, mac)
    const current = item.id === active
    return (
      <div className="nt-rail-slot" key={item.id}>
        <Tooltip
          label={
            <span className="nt-rail-tip">
              {item.label}
              {hint !== undefined && <kbd className="nt-kbd">{hint}</kbd>}
            </span>
          }
        >
          <button
            type="button"
            className="nt-rail-item"
            data-active={current || undefined}
            aria-current={current ? 'page' : undefined}
            aria-label={item.badge ? `${item.label}, ${item.badge} waiting` : item.label}
            {...(hint === undefined ? {} : { 'aria-keyshortcuts': hint })}
            onClick={() => onSelect(item.id)}
          >
            <Icon name={item.icon} size="rail" weight={iconTokens.rail.weight} />
            {item.badge !== undefined && item.badge > 0 && (
              <span className="nt-rail-badge" aria-hidden="true">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        </Tooltip>
      </div>
    )
  }

  const runs = runsOf(items)
  const top = runs.filter((r) => r.group === undefined)
  const groups = runs.filter((r) => r.group !== undefined)

  return (
    <nav className="nt-rail" aria-label={label} onKeyDown={onKeyDown}>
      <div className="nt-rail-brand" aria-hidden="true">
        {brand ?? 'N'}
      </div>
      <div className="nt-rail-list" ref={listRef}>
        <div className="nt-rail-top">{top.flatMap((r) => r.items.map(render))}</div>
        <div className="nt-rail-groups">
          {groups.map((run, i) => (
            <Fragment key={i}>
              <div className="nt-rail-group">{run.items.map(render)}</div>
            </Fragment>
          ))}
        </div>
        <div className="nt-rail-footer">{footer}</div>
      </div>
    </nav>
  )
}
