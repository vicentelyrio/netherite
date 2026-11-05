import { Banner } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { useDecisions } from '../DecisionProvider'

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
