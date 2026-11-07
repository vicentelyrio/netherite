import type { WorkspaceConfig } from '@netherite/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
import { configQuery, keys, noticeFor } from '@/infrastructure/query'

const oneWriteAtATime = { id: 'workspace-config' }

export const useWorkspaceConfig = () => {
  const api = useApi()
  const client = useQueryClient()
  const notices = useNotices()
  const { LL } = useI18nContext()
  const config = useQuery(configQuery(api))
  const update = useMutation({
    scope: oneWriteAtATime,
    mutationFn: (set: Readonly<Record<string, unknown>>) => {
      const current = client.getQueryData<typeof WorkspaceConfig.Type>(keys.config)
      return api.call((c) => c.config.update({ payload: { baseHash: current?.hash ?? '', set } }))
    },
    onSuccess: async ({ hash, settings }) => {
      await client.cancelQueries({ queryKey: keys.config })
      client.setQueryData(keys.config, { hash, settings })
    },
    onError: (error) =>
      void notices.notify(
        noticeFor(LL, error, () => void client.invalidateQueries({ queryKey: keys.config })),
      ),
  })
  return { config, save: update.mutate }
}
