import {
  leaveField,
  moveItem,
  moveSection,
  openItem,
  toggleSidebar,
} from '@/infrastructure/sections'
import { useActionShortcuts } from '@/infrastructure/shortcuts'

export const useSectionKeys = () =>
  useActionShortcuts({
    'section.next': () => moveSection(1),
    'section.previous': () => moveSection(-1),
    'section.sidebar': toggleSidebar,
    'item.next': () => moveItem(1),
    'item.previous': () => moveItem(-1),
    'item.open': openItem,
    'item.back': leaveField,
  })
