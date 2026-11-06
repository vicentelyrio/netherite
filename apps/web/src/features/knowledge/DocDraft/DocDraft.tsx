import { Icon, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { TitleForm } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'
import type { KnowledgeType } from '../KnowledgeProvider'
import '../DocHeader/DocHeader.css'
import '../DocMain/DocMain.css'
import '../DocView/DocView.css'
import './DocDraft.css'

export function DocDraft({
  type,
  project,
}: {
  readonly type: KnowledgeType
  readonly project?: string | undefined
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const navigate = useNavigate()
  const create = useWrite(api, (a, title: string) =>
    a.call((c) =>
      c.items.create({
        payload: { type, title, ...(project === undefined ? {} : { fields: { project } }) },
      }),
    ),
  )
  const label = {
    doc: LL.knowledge.actions.newDoc(),
    adr: LL.knowledge.actions.newAdr(),
    context: LL.knowledge.actions.newContext(),
    runbook: LL.knowledge.actions.newRunbook(),
  }[type]
  const close = () =>
    void (project === undefined
      ? navigate({ to: '/knowledge' })
      : navigate({ to: '/projects/$id', params: { id: project } }))
  return (
    <div className="kf-frame">
      <div className="kf-backdrop" />
      <article className="kf-sheet" aria-label={label}>
        <header className="kf-head">
          <Icon name="stacks" size={16} />
          <nav className="kf-path" aria-label={LL.knowledge.doc.header.path()}>
            <Link to="/knowledge">{LL.knowledge.doc.header.knowledge()}</Link> ›{' '}
            <strong>{label}</strong>
          </nav>
          <TypeBadge type={type as ItemTypeName} />
          <span className="kf-spacer" />
          <button
            type="button"
            className="kf-close"
            aria-label={LL.knowledge.doc.header.close()}
            title={LL.knowledge.doc.header.closeTitle()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={close}
          >
            <Icon name="close" size={20} />
          </button>
        </header>
        <div className="kf-main">
          <TitleForm
            className="kf-draft-title"
            label={label}
            pending={create.isPending}
            onCancel={close}
            onEmpty={() => {}}
            onSubmit={(title) =>
              create.mutate(title, {
                onSuccess: (made) =>
                  void navigate({
                    to: '/items/$id',
                    params: { id: made.id },
                    search: { mode: 'split', fill: true },
                    replace: true,
                  }),
              })
            }
          />
        </div>
      </article>
    </div>
  )
}
