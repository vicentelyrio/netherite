import { useI18nContext } from '@/infrastructure/i18n'
import { useInboxState } from '../InboxProvider'
import { TriageCapture } from './TriageCapture'
import { TriageReason } from './TriageReason'
import { TriageTop } from './TriageTop'
import './TriageDetail.css'

export function TriageDetail() {
  const { LL } = useI18nContext()
  const { selected, tab } = useInboxState()
  if (tab === 'changes' || selected === undefined) {
    return (
      <section className="trd-panel trd-panel-empty" aria-label={LL.inbox.detail.title()}>
        <p className="app-muted">{LL.inbox.detail.pick()}</p>
      </section>
    )
  }
  return (
    <section className="trd-panel" aria-label={LL.inbox.detail.title()}>
      <TriageTop item={selected} />
      <h2 className="trd-title">{selected.title}</h2>
      {selected.rule === 'capture' ? (
        <TriageCapture item={selected} />
      ) : (
        <TriageReason item={selected} />
      )}
    </section>
  )
}
