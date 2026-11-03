import { Banner } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { useDecisions } from '../DecisionProvider'

/** Said above the log when its history is missing or cut short. */
export function DecisionNotices() {
  const { LL } = useI18nContext()
  const { noGit, partial } = useDecisions()
  return (
    <>
      {noGit && (
        <Banner variant="info" title={LL.decisions.noGit()}>
          {LL.decisions.noGitText()}
        </Banner>
      )}
      {partial && (
        <Banner variant="warning" title={LL.decisions.partial()}>
          {LL.decisions.partialText()}
        </Banner>
      )}
    </>
  )
}
