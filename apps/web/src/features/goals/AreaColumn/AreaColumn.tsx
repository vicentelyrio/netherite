import type { GoalRow } from '@netherite/api'
import { Icon, ProgressRing } from '@netherite/ui'
import { CardColumn, EditableText, useReorderList } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { useWrite } from '@/infrastructure/query'
import { noArea } from '../GoalAreas/areas'
import { GoalCard } from '../GoalCard'
import { NewGoal } from '../NewGoal'
import './AreaColumn.css'

export function AreaColumn({
  area,
  goals,
  done,
  total,
  isUnassigned,
  dragging,
  first,
}: {
  readonly area: string
  readonly goals: ReadonlyArray<GoalRow>
  readonly done: number
  readonly total: number
  readonly isUnassigned: boolean
  readonly dragging: GoalRow | undefined
  readonly first: boolean
}) {
  const { LL } = useI18nContext()
  const list = useReorderList(area)
  const target = list.over && dragging !== undefined && (dragging.area ?? noArea) !== area
  const notices = useNotices()
  const api = useApi()
  const remove = useWrite(api, (a) =>
    a.call((c) => c.goals.renameArea({ payload: { from: area, to: '' } })),
  )
  const rename = useWrite(api, (a, to: string) =>
    a.call((c) => c.goals.renameArea({ payload: { from: isUnassigned ? '' : area, to } })),
  )
  const shownArea = isUnassigned ? LL.stats.areas.noArea() : area
  return (
    <CardColumn label={shownArea} rootRef={list.setNodeRef} over={target}>
      <header className="goals-area-head">
        <div className="goals-area-name">
          <EditableText
            as="h2"
            className="goals-area-title"
            rootClassName="goals-area-editable"
            inputClassName="goals-area-input"
            value={shownArea}
            draft={isUnassigned ? '' : undefined}
            onSave={(to) => rename.mutate(to)}
          />
          <p className="goals-area-sub">
            {LL.goals.areaSummary({
              goals: goals.length,
              projects: goals.reduce((n, g) => n + g.projects, 0),
              done,
              total,
            })}
          </p>
        </div>
        {!isUnassigned && (
          <button
            type="button"
            className="goals-area-del"
            aria-label={LL.goals.removeArea({ name: area })}
            title={LL.goals.removeArea({ name: area })}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () =>
                  notices.notify({
                    variant: 'success',
                    title: LL.goals.areaRemoved({ name: area }),
                    text: LL.goals.areaRemovedText(),
                  }),
              })
            }
          >
            <Icon name="delete" size="inline" />
          </button>
        )}
        <ProgressRing done={done} total={total} size={58} label={shownArea} />
      </header>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
      {target && list.blank && (
        <div className="goal-drop">{LL.projects.dropTo({ name: area })}</div>
      )}
      <NewGoal area={isUnassigned ? undefined : area} shortcut={first} />
    </CardColumn>
  )
}
