import { type UiLabels, UiLabelsProvider } from '@netherite/ui'
import { type ReactNode, useMemo } from 'react'
import { useI18nContext } from './i18n-react'

export function TranslatedUi({ children }: { readonly children: ReactNode }) {
  const { LL } = useI18nContext()
  const labels = useMemo<UiLabels>(() => {
    const words = LL.common
    return {
      dismiss: words.dismiss(),
      waiting: (label, count) => words.waiting({ label, count }),
      progress: words.progress(),
      progressOf: (label, done, total) => words.progressOf({ label, done, total }),
      freshness: {
        fresh: words.freshness.fresh(),
        drifting: words.freshness.drifting(),
        stale: words.freshness.stale(),
        unknown: words.freshness.unknown(),
      },
      types: {
        goal: words.types.goal(),
        project: words.types.project(),
        task: words.types.task(),
        adr: words.types.adr(),
        doc: words.types.doc(),
        context: words.types.context(),
        runbook: words.types.runbook(),
      },
      adrStatus: {
        proposed: words.adrStatus.proposed(),
        accepted: words.adrStatus.accepted(),
        deprecated: words.adrStatus.deprecated(),
        superseded: words.adrStatus.superseded(),
      },
      commits: (count, atLeast) =>
        atLeast ? words.commitsAtLeast({ count }) : words.commits({ count }),
      coveredSince: (commits, since) => words.coveredSince({ commits, since }),
    }
  }, [LL])
  return <UiLabelsProvider labels={labels}>{children}</UiLabelsProvider>
}
