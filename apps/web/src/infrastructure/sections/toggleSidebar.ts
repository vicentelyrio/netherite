import { isOverlayOpen, isSidebarFocused, sidebarSelector } from '../shortcuts'
import { focusedElement, sectionOf } from './dom'
import { focusContent } from './focusContent'

const railTarget = '[aria-current="page"]'
let left: HTMLElement | undefined

const toSidebar = () => {
  const sidebar = document.querySelector<HTMLElement>(sidebarSelector)
  if (sidebar === null) return false
  const element = focusedElement()
  left = sectionOf(element) === undefined ? undefined : element
  const target = sidebar.querySelector<HTMLElement>(railTarget) ?? sidebar.querySelector('button')
  target?.focus()
  return true
}

const toPage = () => {
  if (left?.isConnected) left.focus()
  else focusContent()
  return true
}

export const toggleSidebar = () => {
  if (isOverlayOpen()) return false
  return isSidebarFocused() ? toPage() : toSidebar()
}
