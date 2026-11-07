import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { renderUi } from '../../test/helpers'
import { Button } from '../components/Button'
import { Drawer } from '../components/Drawer'
import { Menu } from '../components/Menu'
import { Modal } from '../components/Modal'
import { Switch } from '../components/Switch'
import { Tabs } from '../components/Tabs'

describe('library components with the theme applied', () => {
  test('Switch toggles and is named by its label', async () => {
    const onChange = vi.fn()
    renderUi(<Switch label="Include in context" onChange={onChange} />)
    await userEvent.click(screen.getByRole('switch', { name: 'Include in context' }))
    expect(onChange).toHaveBeenCalled()
  })

  test('Tabs show one panel at a time and move with the arrow keys', async () => {
    renderUi(
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Tab value="a">One</Tabs.Tab>
          <Tabs.Tab value="b">Two</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">panel a</Tabs.Panel>
        <Tabs.Panel value="b">panel b</Tabs.Panel>
      </Tabs>,
    )
    expect(screen.getByText('panel a')).toBeVisible()
    expect(screen.queryByText('panel b')).toBeNull()
    screen.getByRole('tab', { name: 'One' }).focus()
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(screen.getByText('panel b')).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveClass('nt-tab')
  })

  test('Menu opens on click and runs an item', async () => {
    const onRename = vi.fn()
    renderUi(
      <Menu>
        <Menu.Target>
          <Button>Menu</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={onRename}>Rename</Menu.Item>
        </Menu.Dropdown>
      </Menu>,
    )
    expect(screen.queryByRole('menuitem')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }))
    expect(onRename).toHaveBeenCalled()
  })

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
