export const projectViews = [
  { id: 'tasks', label: 'Tasks', icon: 'view_kanban' },
  { id: 'docs', label: 'Docs', icon: 'description' },
  { id: 'knowledge', label: 'Knowledge', icon: 'menu_book' },
] as const

export type ProjectViewId = (typeof projectViews)[number]['id']
