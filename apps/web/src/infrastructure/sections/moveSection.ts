import { focusedElement, pageRoot, sectionOf, sectionSelector, shownIn } from './dom'

export const moveSection = (delta: 1 | -1) => {
  const root = pageRoot()
  if (root === null) return false
  const sections = shownIn(root, sectionSelector)
  if (sections.length === 0) return false
  const at = sections.indexOf(sectionOf(focusedElement()) as HTMLElement)
  const next = at === -1 ? (delta === 1 ? 0 : sections.length - 1) : at + delta
  sections[(next + sections.length) % sections.length]?.focus()
  return true
}
