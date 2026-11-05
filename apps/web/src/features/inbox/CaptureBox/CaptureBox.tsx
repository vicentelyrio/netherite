import { Icon } from '@netherite/ui'
import { type FormEvent, useState } from 'react'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useWrite } from '@/infrastructure/query'
import { useInboxState } from '../InboxProvider'
import './CaptureBox.css'

export function CaptureBox() {
  const { LL } = useI18nContext()
  const api = useApi()
  const { setTab } = useInboxState()
  const [text, setText] = useState('')
  const add = useWrite(api, (a, line: string) =>
    a.call((c) => c.inbox.capture({ payload: { text: line } })),
  )
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const line = text.trim()
    if (line === '' || add.isPending) return
    add.mutate(line, {
      onSuccess: () => {
        setText('')
        setTab('captured')
      },
    })
  }
  return (
    <form className="cb" onSubmit={submit} aria-label={LL.inbox.capture.label()}>
      <Icon name="add" size={18} />
      <input
        className="cb-input"
        aria-label={LL.inbox.capture.label()}
        placeholder={LL.inbox.capture.placeholder()}
        value={text}
        maxLength={500}
        onChange={(e) => setText(e.currentTarget.value)}
      />
    </form>
  )
}
