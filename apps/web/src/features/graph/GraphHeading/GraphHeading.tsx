import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Breadcrumbs } from '@/components'
import { useApi } from '@/infrastructure/api'
import { itemQuery } from '@/infrastructure/query'
import './GraphHeading.css'

/** "Graph", or, when one item is in focus, the path to it and its title. */
export function GraphHeading({ focus }: { readonly focus?: string | undefined }) {
  const api = useApi()
  const focused = useQuery({ ...itemQuery(api, focus ?? ''), enabled: focus !== undefined })
  return (
    <>
      <Breadcrumbs icon="hub">
        {focus ? (
          <>
            <Link to="/graph">Graph</Link>
            <span> / </span>
            <strong>{focused.data?.type ?? focus}</strong>
          </>
        ) : (
          <h1 className="breadcrumbs-title">Graph</h1>
        )}
      </Breadcrumbs>
      {focus && <h1 className="app-title graph-title">{focused.data?.title ?? focus}</h1>}
    </>
  )
}
