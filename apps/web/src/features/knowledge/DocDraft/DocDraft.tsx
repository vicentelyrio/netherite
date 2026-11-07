import { type ItemTypeName, TypeBadge } from '@netherite/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { TitleForm } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'
import { DocBar, DocBarSpacer } from '../DocBar'
import { DocColumn } from '../DocColumn'
import { DocSheet } from '../DocSheet'
import type { KnowledgeType } from '../KnowledgeProvider'
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
        payload: {
          type,
          title,
          ...(type === 'runbook' ? { template: true } : {}),
          ...(project === undefined ? {} : { fields: { project } }),
        },
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
    <DocSheet label={label}>
      <DocBar
        path={
          <>
            <Link to="/knowledge">{LL.knowledge.doc.header.knowledge()}</Link> ›{' '}
            <strong>{label}</strong>
          </>
        }
        keepFocus
        onClose={close}
      >
        <TypeBadge type={type as ItemTypeName} />
        <DocBarSpacer />
      </DocBar>
      <DocColumn>
        <TitleForm
          className="kf-draft-title"
          fieldClassName="kf-draft-field"
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
      </DocColumn>
    </DocSheet>
  )
}
