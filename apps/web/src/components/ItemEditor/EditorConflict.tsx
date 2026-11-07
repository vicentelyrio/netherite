import { Banner, Button } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'

export function EditorConflict({
  onReload,
  onKeepMine,
}: {
  readonly onReload: () => void
  readonly onKeepMine: () => void
}) {
  const { LL } = useI18nContext()
  return (
    <div className="ed-conflict">
      <Banner
        variant="danger"
        title={LL.components.editor.conflictTitle()}
        actions={
          <>
            <Button onClick={onReload}>{LL.components.editor.reload()}</Button>
            <Button onClick={onKeepMine}>{LL.components.editor.keepMine()}</Button>
          </>
        }
      >
        {LL.components.editor.conflictText()}
      </Banner>
    </div>
  )
}
