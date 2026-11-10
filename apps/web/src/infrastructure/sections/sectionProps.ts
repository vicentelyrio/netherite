export const SectionName = {
  Header: 'header',
  Toolbar: 'toolbar',
  Content: 'content',
  Side: 'side',
  Controls: 'controls',
  Footer: 'footer',
  Editor: 'editor',
  Sidebar: 'sidebar',
} as const

export type SectionName = (typeof SectionName)[keyof typeof SectionName]

export const sectionProps = (name: SectionName) => ({ 'data-section': name, tabIndex: -1 })

export const itemProps = (id: string) => ({ 'data-nav-item': id })
