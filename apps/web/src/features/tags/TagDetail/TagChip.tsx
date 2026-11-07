import { percent } from './percent'

export function TagChip({
  name,
  share,
  note,
  onClick,
}: {
  readonly name: string
  readonly share: number
  readonly note: string
  readonly onClick: () => void
}) {
  return (
    <button type="button" className="td-chip" onClick={onClick}>
      <span className="td-chip-name">{name}</span>
      <span className="td-chip-bar" aria-hidden="true">
        <span style={{ width: percent(share) }} />
      </span>
      <span className="td-chip-n">{note}</span>
    </button>
  )
}
