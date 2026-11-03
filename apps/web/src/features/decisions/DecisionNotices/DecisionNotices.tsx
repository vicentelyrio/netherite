import { Banner } from '@netherite/ui'
import { useDecisions } from '../DecisionProvider'

/** Said above the log when its history is missing or cut short. */
export function DecisionNotices() {
  const { noGit, partial } = useDecisions()
  return (
    <>
      {noGit && (
        <Banner variant="info" title="No git history">
          Status changes come from git, so there is no timeline here.
        </Banner>
      )}
      {partial && (
        <Banner variant="warning" title="History is cut short">
          This is a shallow clone, so older status changes are missing.
        </Banner>
      )}
    </>
  )
}
