import { useI18nContext } from '@/infrastructure/i18n'
import type { arrange, SearchHit } from '../results'
import { SearchResultRow } from '../SearchResultRow'
import './SearchResults.css'

/** The results in their groups, or what to type, or that nothing matched. */
export function SearchResults({
  arranged,
  flat,
  q,
  pending,
  highlight,
  onHighlight,
  onOpen,
}: {
  readonly arranged: ReturnType<typeof arrange>
  readonly flat: ReadonlyArray<SearchHit>
  /** What was searched for (after the typing pause). */
  readonly q: string
  readonly pending: boolean
  readonly highlight: number
  readonly onHighlight: (index: number) => void
  readonly onOpen: (hit: SearchHit) => void
}) {
  const { LL } = useI18nContext()
  return (
    <div className="sp-results" role="listbox" aria-label={LL.search.results()}>
      {q.trim() === '' && <div className="sp-empty">{LL.search.empty()}</div>}
      {arranged.map((g) => (
        <div key={g.group}>
          <div className="sp-group">
            <span>{LL.search.groups[g.group]()}</span>
            <span>{g.rows.length}</span>
          </div>
          {g.rows.map((hit) => {
            const index = flat.indexOf(hit)
            return (
              <SearchResultRow
                key={hit.id}
                hit={hit}
                q={q}
                highlighted={index === highlight}
                onHover={() => onHighlight(index)}
                onOpen={() => onOpen(hit)}
              />
            )
          })}
        </div>
      ))}
      {q.trim() !== '' && !pending && flat.length === 0 && (
        <div className="sp-empty">{LL.search.none()}</div>
      )}
    </div>
  )
}
