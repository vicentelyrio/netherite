import { Modal } from '@netherite/ui'
import { MoveChoices } from './MoveChoices'
import type { MovePickerProps } from './MovePicker.types'
import './MovePicker.css'

const pickerWidth = 560

export function MovePicker({
  opened,
  title,
  groups,
  currentLabel,
  onPick,
  onClose,
}: MovePickerProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size={pickerWidth}
      transitionProps={{ duration: 0 }}
    >
      <MoveChoices
        groups={groups}
        currentLabel={currentLabel}
        onPick={(id) => {
          onClose()
          onPick(id)
        }}
      />
    </Modal>
  )
}
