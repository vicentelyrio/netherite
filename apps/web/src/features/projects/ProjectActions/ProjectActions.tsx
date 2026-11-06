import type { Board } from '@netherite/api'
import { ActionIcon } from '@netherite/ui'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { DeleteAction, MovePicker } from '@/components'
import { groupByArea } from '@/features/goals'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { goalsQuery, useWrite } from '@/infrastructure/query'

export const goalsAfterMove = (current: ReadonlyArray<string>, to: string) => [
  to,
  ...current.slice(1).filter((id) => id !== to),
]

export function ProjectActions({ board }: { readonly board: Board }) {
  const { LL } = useI18nContext()
  const text = LL.projects.actions
  const api = useApi()
  const navigate = useNavigate()
  const notices = useNotices()
  const [moving, setMoving] = useState(false)
  const goals = useQuery({ ...goalsQuery(api), enabled: moving })
  const move = useWrite(api, (a, to: string) =>
    a.call((c) =>
      c.items.update({
        params: { id: board.id },
        payload: {
          set: {
            goals: goalsAfterMove(
              board.goals.map((g) => g.id),
              to,
            ),
          },
        },
      }),
    ),
  )
  const remove = useWrite(api, (a) =>
    a.call((c) => c.items.delete({ params: { id: board.id }, query: {} })),
  )
  const parent = board.goals[0]
  const groups = groupByArea(goals.data?.goals ?? []).map(({ area, goals: rows }) => ({
    label: area,
    options: rows.map((g) => ({
      id: g.id,
      title: g.title,
      detail: text.goalProjects({ count: g.projects }),
      progress: g.progress ?? { done: 0, total: 0 },
      current: board.goals.some((b) => b.id === g.id),
    })),
  }))
  return (
    <div className="project-actions">
      <ActionIcon
        icon="drive_file_move"
        label={text.move()}
        variant="subtle"
        color="gray"
        loading={move.isPending}
        onClick={() => setMoving(true)}
      />
      <DeleteAction
        label={text.delete()}
        name={board.title}
        blocked={
          board.tasks.length > 0 || board.linked.length > 0 ? text.deleteBlocked() : undefined
        }
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              notices.notify({ variant: 'success', title: text.deleted({ name: board.title }) })
              void (parent === undefined
                ? navigate({ to: '/goals' })
                : navigate({ to: '/goals/$id', params: { id: parent.id } }))
            },
          })
        }
      />
      <MovePicker
        opened={moving}
        title={text.moveTitle({ name: board.title })}
        groups={groups}
        onClose={() => setMoving(false)}
        onPick={(to) => move.mutate(to)}
      />
    </div>
  )
}
