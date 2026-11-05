import { Drawer, Icon } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { boardQuery, itemQuery, useHealth } from '@/infrastructure/query'
import './TaskDrawer.css'
import { SourceEditor } from '@/features/editor'
import { useI18nContext } from '@/infrastructure/i18n'
import { TaskContent } from '../TaskContent'

/** A task in a drawer: its fields and checklist, and with `code` the file beside them. */
export function TaskDrawer({
  id,
  projectId,
  initial,
  onClose,
}: {
  readonly id: string | undefined
  /** The project whose board the task is on: its states are the task's choices. */
  readonly projectId: string
  /** `code` opens with the file beside the task. */
  readonly initial?: 'code'
  readonly onClose: () => void
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const board = useQuery(boardQuery(api, projectId))
  const columns = board.data?.columns ?? []
  const projectTitle = board.data?.title
  const task = useQuery({ ...itemQuery(api, id ?? ''), enabled: id !== undefined })
  const health = useHealth(api)
  const [mode, setMode] = useState<'text' | 'code'>(initial ?? 'text')
  const [changedLines, setChangedLines] = useState(0)
  const opened = id !== undefined
  useEffect(() => {
    if (!opened) return
    const outside = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('.drawer-content, .board-draggable, [role="dialog"], [data-portal]'))
        return
      onClose()
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [opened, onClose])
  const file = task.data ? `${task.data.id.replace(/^[A-Z]+-0*/, '')} - ${task.data.title}.md` : ''
  const preview =
    id === undefined ? null : (
      <div className="drawer-preview">
        <TaskContent id={id} columns={columns} />
        <Link to="/items/$id" params={{ id }} className="drawer-full">
          {LL.tasks.drawer.openFull()}
        </Link>
      </div>
    )
  return (
    <Drawer
      opened={id !== undefined}
      onClose={onClose}
      position="left"
      lockScroll={false}
      trapFocus={false}
      closeOnClickOutside={false}
      size={mode === 'code' ? 'min(1792px, calc(100vw - 128px))' : 912}
      classNames={{
        body: 'drawer-frame',
        inner: 'drawer-inner',
        content: 'drawer-content',
        header: 'drawer-head',
        overlay: 'drawer-overlay',
        title: 'drawer-title-slot',
      }}
      title={
        id === undefined ? undefined : (
          <nav className="drawer-crumbs" aria-label={LL.tasks.drawer.path()}>
            <Icon name="description" />
            <Link to="/projects">{LL.tasks.drawer.projects()}</Link> ›{' '}
            <Link to="/projects/$id" params={{ id: projectId }}>
              {projectTitle ?? task.data?.project}
            </Link>{' '}
            › <span>{LL.tasks.drawer.tasks()}</span> ›{' '}
            <strong title={file || id}>{file || id}</strong>
            {changedLines > 0 && (
              <span className="drawer-lines">
                {LL.tasks.drawer.changedLines({ count: changedLines })}
              </span>
            )}
          </nav>
        )
      }
    >
      {id !== undefined && (
        <SourceEditor
          id={id}
          variant="drawer"
          preview={preview}
          mode={mode === 'code' ? 'split' : 'text'}
          onModeChange={(m) => setMode(m === 'split' ? 'code' : 'text')}
          onStats={(stats) => setChangedLines(stats.changedLines)}
          branch={health.data?.branch}
        />
      )}
    </Drawer>
  )
}
