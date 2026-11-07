import { Icon } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onFit,
}: {
  readonly onZoomIn: () => void
  readonly onZoomOut: () => void
  readonly onFit: () => void
}) {
  const { LL } = useI18nContext()
  const text = LL.components.graph
  return (
    <div className="gv-controls" role="toolbar" aria-label={text.zoom()}>
      <button type="button" aria-label={text.zoomIn()} title={text.zoomIn()} onClick={onZoomIn}>
        <Icon name="add" />
      </button>
      <button type="button" aria-label={text.zoomOut()} title={text.zoomOut()} onClick={onZoomOut}>
        <Icon name="remove" />
      </button>
      <span className="gv-controls-rule" />
      <button type="button" aria-label={text.fit()} title={text.fitTitle()} onClick={onFit}>
        <Icon name="fit_screen" />
      </button>
    </div>
  )
}
