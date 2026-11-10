import { isEditable } from '../shortcuts'
import { focusedElement, sectionOf } from './dom'

const keepsEscape = 'data-mantine-stop-propagation'

export const isFieldFocused = () => {
  const element = focusedElement()
  return element !== undefined && (isEditable(element) || element.hasAttribute(keepsEscape))
}

export const leaveField = () => {
  const element = focusedElement()
  if (element === undefined || element.hasAttribute(keepsEscape) || !isEditable(element))
    return false
  const section = sectionOf(element)
  if (section === undefined) return false
  section.focus()
  return true
}
