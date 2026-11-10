import { focusedElement, itemAttribute, itemSelector } from './dom'

export const focusedItem = () =>
  focusedElement()?.closest(itemSelector)?.getAttribute(itemAttribute) ?? undefined

export const focusItem = (id: string) =>
  document.querySelector<HTMLElement>(`[${itemAttribute}="${id}"]`)?.focus()
