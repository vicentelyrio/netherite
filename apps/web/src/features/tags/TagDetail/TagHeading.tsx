import { Icon } from '@netherite/ui'
import type { ReactNode } from 'react'

export function TagHeading({
  title,
  meta,
  children,
}: {
  readonly title: string
  readonly meta: ReactNode
  readonly children?: ReactNode
}) {
  return (
    <header className="td-head">
      <div>
        <h2 className="td-name">
          <Icon name="sell" size={20} className="td-name-icon" />
          {title}
        </h2>
        <span className="td-meta">{meta}</span>
      </div>
      {children}
    </header>
  )
}
