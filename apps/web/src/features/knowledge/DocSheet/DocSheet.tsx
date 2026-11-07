import type { ReactNode } from 'react'
import './DocSheet.css'

export function DocSheet({
  label,
  hash,
  children,
}: {
  readonly label: string
  readonly hash?: string
  readonly children: ReactNode
}) {
  return (
    <div className="kf-frame" {...(hash === undefined ? {} : { 'data-hash': hash })}>
      <div className="kf-backdrop" />
      <article
        className="kf-sheet"
        aria-label={label}
        {...(hash === undefined ? {} : { 'data-hash': hash })}
      >
        {children}
      </article>
    </div>
  )
}
