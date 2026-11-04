import { Icon, type ItemTypeName, TypeGlyph } from '@netherite/ui'
import { Highlight } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import type { SearchHit } from '../results'
import './SearchResultRow.css'

/** One result: its glyph, title with the match marked, a snippet, a status and where it is from. */
export function SearchResultRow({
  hit,
  q,
  highlighted,
  onHover,
  onOpen,
}: {
  readonly hit: SearchHit
  readonly q: string
  readonly highlighted: boolean
  readonly onHover: () => void
  readonly onOpen: () => void
}) {
  const { LL } = useI18nContext()
  const status = hit.status ?? hit.state
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: the input keeps focus; arrows move the highlight
    <div
      role="option"
      aria-selected={highlighted}
      className="sp-row"
      data-hi={highlighted || undefined}
      onMouseEnter={onHover}
      onClick={onOpen}
      onKeyDown={undefined}
    >
      <span className="sp-glyph">
        <TypeGlyph type={hit.type as ItemTypeName} hollow={hit.status === 'superseded'} />
      </span>
      <div className="sp-main">
        <div className="sp-title">
          <span className="sp-id">
            <Highlight text={hit.id} q={q} />
          </span>
          <span className="sp-name" data-old={hit.status === 'superseded' || undefined}>
            <Highlight text={hit.title} q={q} />
          </span>
        </div>
        {hit.snippet && (
          <span className="sp-snip">
            <Highlight text={hit.snippet} q={q} />
          </span>
        )}
      </div>
      {hit.stale && (
        <span
          className="sp-stale"
          title={LL.search.stale()}
          role="img"
          aria-label={LL.search.stale()}
        >
          <Icon name="warning" size={15} filled />
        </span>
      )}
      {status && (
        <span className="sp-status" data-s={status}>
          {status}
        </span>
      )}
      <span className="sp-meta">{hit.project ?? hit.type}</span>
    </div>
  )
}
