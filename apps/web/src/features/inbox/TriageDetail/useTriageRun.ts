import { useApi } from '@/infrastructure/api'
import { useNotices } from '@/infrastructure/notices'
import { useWrite } from '@/infrastructure/query'
import type { Entry } from '../triage'
import type { Act } from './TriageDetail.types'

export const useTriageRun = (item: Entry) => {
  const api = useApi()
  const notices = useNotices()
  const run = useWrite(api, (a, act: Act) => a.call(act))
  return {
    pending: run.isPending,
    go: (act: Act, title: string) =>
      run.mutate(act, {
        onSuccess: () => notices.notify({ variant: 'success', title, text: item.title }),
      }),
  }
}
