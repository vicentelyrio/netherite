import { ActionIcon, Button, Modal } from '@netherite/ui'
import { useState } from 'react'
import { useI18nContext } from '@/infrastructure/i18n'
import './DeleteAction.css'

export interface DeleteActionProps {
  readonly label: string
  readonly name: string
  readonly blocked?: string | undefined
  readonly pending?: boolean
  readonly onConfirm: () => void
}

export function DeleteAction({
  label,
  name,
  blocked,
  pending = false,
  onConfirm,
}: DeleteActionProps) {
  const { LL } = useI18nContext()
  const [asking, setAsking] = useState(false)
  const text = LL.components.deleteAction
  return (
    <>
      <ActionIcon
        icon="delete"
        label={blocked ?? label}
        variant="subtle"
        color="gray"
        loading={pending}
        {...(blocked === undefined ? {} : { 'aria-disabled': true, 'data-disabled': true })}
        onClick={() => blocked === undefined && setAsking(true)}
      />
      <Modal
        opened={asking}
        onClose={() => setAsking(false)}
        title={text.title({ name })}
        transitionProps={{ duration: 0 }}
      >
        <p className="delete-action-text">{text.text()}</p>
        <div className="delete-action-buttons">
          <Button size="md" onClick={() => setAsking(false)}>
            {text.cancel()}
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => {
              setAsking(false)
              onConfirm()
            }}
          >
            {text.confirm()}
          </Button>
        </div>
      </Modal>
    </>
  )
}
