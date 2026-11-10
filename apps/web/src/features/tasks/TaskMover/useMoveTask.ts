import { useNavigate } from '@tanstack/react-router'
import { useApi } from '@/infrastructure/api'
import { useWrite } from '@/infrastructure/query'

export const useMoveTask = (id: string | undefined) => {
  const api = useApi()
  const navigate = useNavigate()
  const move = useWrite(api, (a, to: { task: string; project: string }) =>
    a.call((c) =>
      c.items.update({ params: { id: to.task }, payload: { set: { project: to.project } } }),
    ),
  )
  return {
    pending: move.isPending,
    pick: (project: string) => {
      if (id === undefined) return
      move.mutate(
        { task: id, project },
        {
          onSuccess: () =>
            void navigate({
              to: '/projects/$id',
              params: { id: project },
              search: { task: id },
            }),
        },
      )
    },
  }
}
