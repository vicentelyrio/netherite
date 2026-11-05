import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Breadcrumbs } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { itemQuery } from '@/infrastructure/query'
import './GraphHeading.css'

export function GraphHeading({ focus }: { readonly focus?: string | undefined }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const focused = useQuery({ ...itemQuery(api, focus ?? ''), enabled: focus !== undefined })
  return (
    <>
      <Breadcrumbs icon="hub">
        {focus ? (
          <>
            <Link to="/graph">{LL.graph.title()}</Link>
            <span> / </span>
            <strong>{focused.data?.type ?? focus}</strong>
          </>
        ) : (
          <h1 className="breadcrumbs-title">{LL.graph.title()}</h1>
        )}
      </Breadcrumbs>
      {focus && <h1 className="app-title graph-title">{focused.data?.title ?? focus}</h1>}
    </>
  )
}
