import {
  CaptureBox,
  InboxActions,
  InboxGroups,
  InboxHeading,
  InboxProvider,
  InboxToolbar,
  TriageDetail,
  TriageList,
  useInboxState,
} from '@/features/inbox'
import { SplitTemplate } from '@/templates'

function Main() {
  const { tab } = useInboxState()
  if (tab === 'changes') return <InboxGroups />
  return (
    <>
      <CaptureBox />
      <TriageList />
    </>
  )
}

export function InboxPage() {
  return (
    <InboxProvider>
      <SplitTemplate
        header={<InboxHeading />}
        actions={<InboxActions />}
        toolbar={<InboxToolbar />}
        main={<Main />}
        aside={<TriageDetail />}
      />
    </InboxProvider>
  )
}
