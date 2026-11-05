import { AdrDiamond, AdrIdLink } from '@/components'
import '../shared.css'
import { useI18nContext } from '@/infrastructure/i18n'
import './SupersessionChain.css'

/** The ADRs that replaced one another, newest first, with this one marked. */
export function SupersessionChain({
  id,
  chain,
}: {
  readonly id: string
  readonly chain: ReadonlyArray<{ id: string; title: string; status?: string | undefined }>
}) {
  const { LL } = useI18nContext()
  if (chain.length < 2) return null
  const newest = [...chain].reverse()
  return (
    <section aria-label={LL.knowledge.doc.chain.title()} className="kf-section">
      <h2 className="kf-h">{LL.knowledge.doc.chain.title()}</h2>
      <div className="kf-chain">
        {newest.map((link, i) => (
          <div key={link.id}>
            {i > 0 && (
              <div className="kf-chain-gap">
                <span />
                {LL.knowledge.doc.chain.supersedes()}
              </div>
            )}
            <div
              className="kf-chain-row"
              data-current={link.id === id || undefined}
              data-old={link.status === 'superseded' || undefined}
            >
              <AdrDiamond hollow={link.status === 'superseded'} />
              <AdrIdLink id={link.id} />
              <span className="kf-chain-title">{link.title}</span>
              {link.id === id ? (
                <span className="app-muted">{LL.knowledge.doc.chain.this()}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
