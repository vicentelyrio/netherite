import { Icon } from '@netherite/ui'
import type { ReactNode } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import './DocBar.css'

export function DocBar({
  path,
  children,
  onClose,
  keepFocus = false,
}: {
  readonly path: ReactNode
  readonly children: ReactNode
  readonly onClose: () => void
  readonly keepFocus?: boolean
}) {
  const { LL } = useI18nContext()
  return (
    <header className="kf-head">
      <Icon name="stacks" size={16} />
      <nav className="kf-path" aria-label={LL.knowledge.doc.header.path()}>
        {path}
      </nav>
      {children}
      <button
        type="button"
        className="kf-close"
        aria-label={LL.knowledge.doc.header.close()}
        title={LL.knowledge.doc.header.closeTitle()}
        {...(keepFocus
          ? { onMouseDown: (e: { preventDefault: () => void }) => e.preventDefault() }
          : {})}
        onClick={onClose}
      >
        <Icon name="close" size={20} />
      </button>
    </header>
  )
}
