import { Avatar, designColor, Icon } from '@netherite/ui'
import { AdrDiamond, AdrIdLink } from '@/components'
import { formatDay, formatYear } from '@/infrastructure/datetime'
import { type CommitCardData, statusStyle } from '../lanes'
import { StatusChip } from '../StatusChip'
import './CommitCard.css'

export function CommitCard({ commit }: { readonly commit: CommitCardData }) {
  const top = commit.changes.find((c) => c.to !== 'superseded') ?? commit.changes[0]
  const color = statusStyle[top?.to ?? '']?.color ?? designColor.text.secondary
  const chain = commit.changes.some((c) => c.link)
  return (
    <div className="dl-commit">
      <div className="dl-date">
        <strong>{formatDay(commit.date)}</strong>
        <span>{formatYear(commit.date)}</span>
      </div>
      <div className="dl-node-col">
        <span
          className="dl-node"
          style={{ borderColor: color, background: chain ? designColor.bg.canvas : color }}
        />
      </div>
      <div className="dl-card" data-chain={chain || undefined}>
        <div className="dl-card-head">
          <Avatar name={commit.author} size={18} />
          <span>{commit.author}</span>
          <span className="dl-spacer" />
          <code>{commit.hash.slice(0, 7)}</code>
        </div>
        {commit.changes.map((c) => (
          <div key={`${c.id}:${c.to}`} className="dl-change">
            {c.link && (
              <div className="dl-supersedes">
                <span />
                <Icon name="south" size={14} /> supersedes
              </div>
            )}
            <div className="dl-change-title" data-old={c.to === 'superseded' || undefined}>
              <AdrDiamond hollow={c.to === 'superseded'} />
              <AdrIdLink id={c.id} />
              <strong>{c.title}</strong>
            </div>
            <div className="dl-change-chips">
              {c.from !== undefined && (
                <>
                  <StatusChip status={c.from} faded />
                  <Icon name="arrow_forward" size={14} />
                </>
              )}
              <StatusChip status={c.to} />
              {c.note && <span className="app-muted">{c.note}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
