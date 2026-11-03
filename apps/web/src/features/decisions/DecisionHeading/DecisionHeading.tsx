import { Link } from '@tanstack/react-router'
import { Breadcrumbs } from '@/components'
import './DecisionHeading.css'

/** Breadcrumb, title and where the changes come from. */
export function DecisionHeading() {
  return (
    <div>
      <Breadcrumbs icon="stacks">
        <Link to="/knowledge">Knowledge</Link>
        <span> / </span>
        <strong>Decision log</strong>
      </Breadcrumbs>
      <h1 className="app-title dl-title">Decision log</h1>
      <p className="kn-sub">
        Status changes from <code className="dl-code">git log -- knowledge/adr</code> · newest first
      </p>
    </div>
  )
}
