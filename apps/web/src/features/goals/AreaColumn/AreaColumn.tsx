import type { GoalRow } from '@netherite/api'
import { Icon, ProgressRing } from '@netherite/ui'
import { CardColumn, EditableText } from '@/components'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { useWrite } from '@/infrastructure/query'
import { GoalCard } from '../GoalCard'
import { NewGoal } from '../NewGoal'
import './AreaColumn.css'

/** One area: its name and overall progress, its goals, and a way to add another goal. */
export function AreaColumn({
  area,
  goals,
  done,
  total,
  isUnassigned,
}: {
  readonly area: string
  readonly goals: ReadonlyArray<GoalRow>
  readonly done: number
  readonly total: number
  /** The "No area" group: new goals made here get no area. */
  readonly isUnassigned: boolean
}) {
  const { LL } = useI18nContext()
  const notices = useNotices()
  const api = useApi()
  const remove = useWrite(api, (a) =>
    a.call((c) => c.goals.renameArea({ payload: { from: area, to: '' } })),
  )
  const rename = useWrite(api, (a, to: string) =>
    a.call((c) => c.goals.renameArea({ payload: { from: isUnassigned ? '' : area, to } })),
  )
  return (
    <CardColumn label={area}>
      <header className="goals-area-head">
        <div className="goals-area-name">
          <EditableText
            as="h2"
            className="goals-area-title"
            value={area}
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
        <ProgressRing done={done} total={total} size={58} label={area} />
      </header>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
      <NewGoal area={isUnassigned ? undefined : area} />
    </CardColumn>
  )
}
