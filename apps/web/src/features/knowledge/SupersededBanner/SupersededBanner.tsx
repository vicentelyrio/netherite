import { Icon } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import '../shared.css'
import './SupersededBanner.css'

/** Said on an ADR that a newer one replaced: who replaced it, and a link to it. */
export function SupersededBanner({
  newer,
}: {
  readonly newer:
    | { readonly id?: string | undefined; readonly title?: string | undefined }
    | undefined
}) {
  return (
    <div className="kf-superseded">
      <Icon name="swap_horiz" size={20} />
      <div>
        <strong>
          Superseded by {newer?.id ?? 'a newer decision'}
          {newer?.title ? ` · ${newer.title}` : ''}
        </strong>
        <span>This record is kept for history and no longer applies.</span>
      </div>
      {newer?.id && (
        <Link to="/items/$id" params={{ id: newer.id }} className="kf-open">
          Open {newer.id} <Icon name="arrow_forward" size={16} />
        </Link>
      )}
    </div>
  )
}
