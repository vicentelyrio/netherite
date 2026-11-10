import { groupOrder, type ShortcutGroup, type ShortcutScope } from '@/infrastructure/shortcuts'

const alwaysShown: ReadonlyArray<ShortcutGroup> = ['movement', 'navigation', 'editor']

export const sheetGroups = (active: ReadonlySet<ShortcutScope>): ReadonlyArray<ShortcutGroup> => [
  ...groupOrder.filter(
    (group) => !alwaysShown.includes(group) && active.has(group as ShortcutScope),
  ),
  ...alwaysShown,
]
