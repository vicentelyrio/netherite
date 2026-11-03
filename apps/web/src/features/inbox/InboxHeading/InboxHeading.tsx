import { Breadcrumbs } from '@/components'
import { ago } from '@/infrastructure/datetime'
import { useInboxState } from '../InboxProvider'

/** Breadcrumb, title, how many things need you and how far back the changes go. */
export function InboxHeading() {
  const { waiting, since } = useInboxState()
  return (
    <div>
      <Breadcrumbs icon="inbox">
        <strong>Inbox</strong>
      </Breadcrumbs>
      <h1 className="app-title kn-h1">Inbox</h1>
      <p className="kn-sub">
        {waiting === 0
          ? 'Nothing needs you'
          : `${waiting} ${waiting === 1 ? 'thing needs' : 'things need'} you`}
        {' · '}
        {since ? `changes since ${ago(since)}` : 'changes since the beginning'}
      </p>
    </div>
  )
}
