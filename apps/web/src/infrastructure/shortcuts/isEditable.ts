const editableTags = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || editableTags.has(target.tagName))
