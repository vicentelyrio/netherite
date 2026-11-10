import { SectionName } from './sectionProps'

const settleFrames = 120
const contentSelector = `main [data-section="${SectionName.Content}"]`

const isFocusLost = () =>
  document.activeElement === null || document.activeElement === document.body

export const focusContent = (frames = settleFrames, landed = false) => {
  const content = document.querySelector<HTMLElement>(contentSelector)
  const shouldFocus = content !== null && (!landed || isFocusLost())
  if (shouldFocus) content.focus()
  if (frames > 0) requestAnimationFrame(() => focusContent(frames - 1, landed || shouldFocus))
}
