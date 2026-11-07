import { CaptureBox, InboxGroups, TriageList, useInboxState } from '@/features/inbox'

export function InboxMain() {
  const { tab } = useInboxState()
  if (tab === 'changes') return <InboxGroups />
  return (
    <>
      <CaptureBox />
      <TriageList />
    </>
  )
}
