import { Icon } from '@netherite/ui'
import { Link } from '@tanstack/react-router'
import '../shared.css'
import { useI18nContext } from '@/infrastructure/i18n'
import './SupersededBanner.css'

/** Said on an ADR that a newer one replaced: who replaced it, and a link to it. */
export function SupersededBanner({
  newer,
}: {
  readonly newer:
    | { readonly id?: string | undefined; readonly title?: string | undefined }
    | undefined
}) {
  const { LL } = useI18nContext()
  return (
    <div className="kf-superseded">
      <Icon name="swap_horiz" size={20} />
      <div>
        <strong>
          {LL.knowledge.doc.superseded.title({
            what: newer?.id ?? LL.knowledge.doc.superseded.fallback(),
          })}
          {newer?.title ? ` · ${newer.title}` : ''}
        </strong>
        <span>{LL.knowledge.doc.superseded.text()}</span>
      </div>
      {newer?.id && (
        <Link to="/items/$id" params={{ id: newer.id }} className="kf-open">
          {LL.knowledge.doc.superseded.open({ id: newer.id })}{' '}
          <Icon name="arrow_forward" size={16} />
        </Link>
      )}
    </div>
  )
}
