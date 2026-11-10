export const sidebarSelector = '[data-section="sidebar"]'

export const isSidebarFocused = () =>
  document.activeElement?.closest(sidebarSelector) instanceof Element
