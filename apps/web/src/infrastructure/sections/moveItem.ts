import { focusedElement, isInsideOverlay, itemsIn, sectionOf } from './dom'
import { hasKeyboardFocus } from './hasKeyboardFocus'

export const moveItem = (delta: 1 | -1) => {
  const element = focusedElement()
  const section = sectionOf(element)
  if (element === undefined || section === undefined) return false
  if (!hasKeyboardFocus(element) || !isInsideOverlay(section)) return false
  const items = itemsIn(section)
  if (items.length === 0) return false
  const at = items.findIndex((item) => item === element || item.contains(element))
  const next = at === -1 ? (delta === 1 ? items[0] : items.at(-1)) : items[at + delta]
  next?.focus()
  return true
}
