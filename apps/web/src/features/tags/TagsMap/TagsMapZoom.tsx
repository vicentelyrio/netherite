import { Icon } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'

export function TagsMapZoom({
  onIn,
  onOut,
  onFit,
}: {
  readonly onIn: () => void
  readonly onOut: () => void
  readonly onFit: () => void
}) {
  const { LL } = useI18nContext()
  return (
    <div className="tm-zoom">
      <button type="button" aria-label={LL.tags.map.zoomIn()} onClick={onIn}>
        <Icon name="add" size="inline" />
      </button>
      <button type="button" aria-label={LL.tags.map.zoomOut()} onClick={onOut}>
        <Icon name="remove" size="inline" />
      </button>
      <button type="button" aria-label={LL.tags.map.fit()} onClick={onFit}>
        <Icon name="fit_screen" size="inline" />
      </button>
    </div>
  )
}
