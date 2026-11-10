import { focusedElement, itemSelector } from './dom'

const nativelyOpens = 'a[href], button'

export const openItem = () => {
  const element = focusedElement()
  if (element === undefined || !element.matches(itemSelector) || element.matches(nativelyOpens))
    return false
  element.click()
  return true
}
