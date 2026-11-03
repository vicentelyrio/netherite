export const projectViews = [
  { id: 'tasks', icon: 'view_kanban' },
  { id: 'docs', icon: 'description' },
  { id: 'knowledge', icon: 'menu_book' },
] as const

export type ProjectViewId = (typeof projectViews)[number]['id']
