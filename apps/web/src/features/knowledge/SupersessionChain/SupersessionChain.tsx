import { AdrDiamond, AdrIdLink } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { PanelSection } from '../PanelSection'
import './SupersessionChain.css'

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
    <PanelSection label={LL.knowledge.doc.chain.title()} title={LL.knowledge.doc.chain.title()}>
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
    </PanelSection>
  )
}
