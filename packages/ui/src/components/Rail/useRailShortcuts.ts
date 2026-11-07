import { useShortcuts } from '../../shortcuts'
import type { RailItem } from './Rail.types'

export const useRailShortcuts = (
  items: ReadonlyArray<RailItem>,
  onSelect: (id: string) => void,
  enabled: boolean,
  mac: boolean | undefined,
) =>
  useShortcuts(
    Object.fromEntries(
      items.flatMap((item) =>
        [item.shortcut, ...(item.aliases ?? [])].flatMap((key) =>
          key === undefined ? [] : [[key, () => onSelect(item.id)]],
        ),
      ),
    ),
    { enabled, ...(mac === undefined ? {} : { mac }) },
  )
