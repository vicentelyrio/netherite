import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { renderUi } from '../../../test/helpers'
import { Drawer } from '../Drawer'
import { Modal } from './index'

describe('Modal', () => {
  test('Modal and Drawer show their title and content when open, and close with Escape', async () => {
    const onClose = vi.fn()
    renderUi(
      <>
        <Modal opened onClose={onClose} title="Delete TASK-00042?">
          modal text
        </Modal>
        <Drawer opened onClose={onClose} title="TASK-00042">
          drawer text
        </Drawer>
      </>,
    )
    expect(await screen.findByText('modal text')).toBeInTheDocument()
    expect(screen.getByText('drawer text')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Delete TASK-00042?' })).toBeInTheDocument()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  test('Modal and Drawer are absent while closed', () => {
    renderUi(
      <Modal opened={false} onClose={() => {}} title="x">
        hidden
      </Modal>,
    )
    expect(screen.queryByText('hidden')).toBeNull()
  })
})
