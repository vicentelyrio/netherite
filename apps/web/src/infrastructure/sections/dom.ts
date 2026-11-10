import { overlaySelector } from '../shortcuts'

export const sectionSelector = '[data-section]'
export const itemAttribute = 'data-nav-item'
export const itemSelector = `[${itemAttribute}]`
const focusableSelector = 'a[href], button:not([disabled]), [tabindex="0"]'

const isShown = (element: HTMLElement) => element.checkVisibility?.() ?? true

export const shownIn = (root: ParentNode, selector: string) =>
  [...root.querySelectorAll<HTMLElement>(selector)].filter(isShown)

const topOverlay = () => [...document.querySelectorAll<HTMLElement>(overlaySelector)].at(-1)

export const pageRoot = (): HTMLElement | null => topOverlay() ?? document.querySelector('main')

export const focusedElement = () =>
  document.activeElement instanceof HTMLElement ? document.activeElement : undefined

export const sectionOf = (element: Element | undefined) =>
  element?.closest<HTMLElement>(sectionSelector) ?? undefined

export const itemsIn = (section: HTMLElement) => {
  const declared = shownIn(section, itemSelector)
  return declared.length > 0 ? declared : shownIn(section, focusableSelector)
}

export const isInsideOverlay = (element: Element) => {
  const overlay = topOverlay()
  return overlay === undefined || overlay.contains(element)
}
