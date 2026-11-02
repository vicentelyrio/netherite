import { Conflict, Failure, Invalid, NotFound, Refused } from '@netherite/api'
import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Api } from '../api'
import { type Notice, type Notices, useNotices } from '../notices'

/** The message for a failed call, as a notice. Conflicts offer to reload. */
export const noticeFor = (error: unknown, reload: () => void): Omit<Notice, 'id'> => {
  if (error instanceof Conflict) {
    return {
      variant: 'danger',
      title: 'Changed on disk',
      text: `${error.path} changed since you opened it, so nothing was saved. Reload to see the new version, then make the change again.`,
      actions: [{ label: 'Reload', run: reload }],
    }
  }
  if (error instanceof Invalid) {
    const problems = error.issues.map((i) =>
      i.path.length > 0 ? `${i.path.join('.')}: ${i.message}` : i.message,
    )
    return {
      variant: 'warning',
      title: 'That change is not valid',
      text: problems.join('; ') || error.message,
    }
  }
  if (error instanceof NotFound)
    return { variant: 'warning', title: 'Not found', text: error.message }
  if (error instanceof Refused)
    return { variant: 'warning', title: 'Not allowed', text: error.message }
  if (error instanceof Failure)
    return { variant: 'danger', title: 'The server could not do that', text: error.message }
  return {
    variant: 'danger',
    title: 'Could not reach the server',
    text: error instanceof Error ? error.message : 'Check that `netherite serve` is still running.',
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
  return useMutation({
    mutationFn: (vars: Vars) => run(api, vars),
    onSuccess: () => void refresh(client),
    onError: (error) =>
      void notices.notify(noticeFor(error, options.reload ?? (() => void refresh(client)))),
  })
}
