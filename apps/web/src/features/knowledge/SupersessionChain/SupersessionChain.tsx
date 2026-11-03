import { AdrDiamond, AdrIdLink } from '@/components'
import '../shared.css'
import './SupersessionChain.css'

/** The ADRs that replaced one another, newest first, with this one marked. */
export function SupersessionChain({
  id,
  chain,
}: {
  readonly id: string
  readonly chain: ReadonlyArray<{ id: string; title: string; status?: string | undefined }>
}) {
  if (chain.length < 2) return null
  // Newest first, as the design lists them: each one supersedes the next.
  const newest = [...chain].reverse()
  return (
    <section aria-label="Supersession chain" className="kf-section">
      <h2 className="kf-h">Supersession chain</h2>
      <div className="kf-chain">
        {newest.map((link, i) => (
          <div key={link.id}>
            {i > 0 && (
              <div className="kf-chain-gap">
                <span />
                supersedes
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
              {link.id === id ? <span className="app-muted">this</span> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
