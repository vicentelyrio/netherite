import { Conflict, Failure, Invalid, NotFound, Refused } from '@netherite/api'
import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Api } from '../api'
import { type TranslationFunctions, useI18nContext } from '../i18n'
import { type Notice, type Notices, useNotices } from '../notices'

/** The message for a failed call, as a notice. Conflicts offer to reload. */
export const noticeFor = (
  LL: TranslationFunctions,
  error: unknown,
  reload: () => void,
): Omit<Notice, 'id'> => {
  if (error instanceof Conflict) {
    return {
      variant: 'danger',
      title: LL.notices.changedOnDisk(),
      text: LL.notices.changedOnDiskText({ path: error.path }),
      actions: [{ label: LL.notices.reload(), run: reload }],
    }
  }
  if (error instanceof Invalid) {
    const problems = error.issues.map((i) =>
      i.path.length > 0 ? `${i.path.join('.')}: ${i.message}` : i.message,
    )
    return {
      variant: 'warning',
      title: LL.notices.invalid(),
      text: problems.join('; ') || error.message,
    }
  }
  if (error instanceof NotFound)
    return { variant: 'warning', title: LL.notices.notFound(), text: error.message }
  if (error instanceof Refused)
    return { variant: 'warning', title: LL.notices.notAllowed(), text: error.message }
  if (error instanceof Failure)
    return { variant: 'danger', title: LL.notices.serverFailed(), text: error.message }
  return {
    variant: 'danger',
    title: LL.notices.unreachable(),
    text: error instanceof Error ? error.message : LL.common.serveHint(),
  }
}

/** Refreshes everything about items after a write (the event stream does too; this is just sooner). */
export const refresh = (client: QueryClient) =>
  Promise.all(
    [['items'], ['goals'], ['projects'], ['knowledge'], ['tags'], ['graph']].map((queryKey) =>
      client.invalidateQueries({ queryKey }),
    ),
  )

/**
 * A write to the server. On success the item queries refresh. On failure the person is told why in
 * a notice, and a conflict (the file changed since it was read) offers to reload the item.
 */
export const useWrite = <A, Vars>(
  api: Api,
  run: (api: Api, vars: Vars) => Promise<A>,
  options: { reload?: () => void } = {},
) => {
  const client = useQueryClient()
  const notices: Notices = useNotices()
  const { LL } = useI18nContext()
  return useMutation({
    mutationFn: (vars: Vars) => run(api, vars),
    onSuccess: () => void refresh(client),
    onError: (error) =>
      void notices.notify(noticeFor(LL, error, options.reload ?? (() => void refresh(client)))),
  })
}
