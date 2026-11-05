import { Link } from '@tanstack/react-router'
import { Breadcrumbs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import './DecisionHeading.css'

export function DecisionHeading() {
  const { LL } = useI18nContext()
  return (
    <div>
      <Breadcrumbs icon="stacks">
        <Link to="/knowledge">{LL.decisions.heading.knowledge()}</Link>
        <span> / </span>
        <strong>{LL.decisions.heading.title()}</strong>
      </Breadcrumbs>
      <h1 className="app-title dl-title">{LL.decisions.heading.title()}</h1>
      <p className="kn-sub">{LL.decisions.heading.text()}</p>
    </div>
  )
}
